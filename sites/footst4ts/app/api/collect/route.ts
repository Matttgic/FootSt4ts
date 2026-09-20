import {setting,lock,database} from '@/lib/football/store';
import {loadMatches,collectOdds,quotesFor} from '@/lib/football/providers';
import {parisDate} from '@/lib/football/core';
import {trainingHistory} from '@/lib/football/training';
import {matchAnalysis} from '@/lib/football/analysis';
import {saveProspective} from '@/lib/football/prospective';
export async function POST(request:Request){
 const token=setting('COLLECT_TOKEN');
 if(!token||request.headers.get('authorization')!==`Bearer ${token}`)return Response.json({error:'Accès réservé à la collecte'},{status:401});
 try{
  if(!await lock('collect:global',15*60000))return Response.json({error:'Collecte limitée à une fois toutes les 15 minutes'},{status:429});
  const day=parisDate(),{matches}=await loadMatches(day);
  const odds=await collectOdds(false,matches);
  const [training,quotes]=await Promise.all([trainingHistory(matches,day),quotesFor(matches)]);
  const analyses=matches.filter(m=>m.date===day).map(m=>matchAnalysis(training,m,quotes));
  await saveProspective(analyses,matches,quotes);
  await database().prepare("DELETE FROM cache WHERE key LIKE 'view:%' OR key LIKE 'journal:%'").run();
  return Response.json({odds,analysed:analyses.length,completedAt:new Date().toISOString(),message:'Même modèle et mêmes règles que le site. Aucun pari réel.'});
 }catch{return Response.json({error:'Collecte interrompue, dernières données conservées'},{status:503})}
}
