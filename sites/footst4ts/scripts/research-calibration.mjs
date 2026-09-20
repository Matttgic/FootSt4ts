import fs from 'node:fs';
import crypto from 'node:crypto';
import {normalizeOpen,fit} from '../lib/football/core.ts';
const temperatures=[.8,1,1.2,1.5];
const keys=['home','draw','away'];
const transform=(ps,t)=>{const a=ps.map(p=>Math.pow(Math.max(p,1e-12),1/t)),sum=a.reduce((s,p)=>s+p,0);return a.map(p=>p/sum)};
const score=(p,y)=>({brier:p.reduce((s,v,i)=>s+(v-Number(i===y))**2,0),logloss:-Math.log(Math.max(p[y],1e-12))});
const mean=(rows,key)=>rows.length?rows.reduce((s,r)=>s+r[key],0)/rows.length:null;
const leagues=[],paired=[],sources=[];
for(const id of ['en.1','fr.1','es.1','it.1','de.1']){
 const path=`data/2025-26-${id}.json`,raw=fs.readFileSync(path);
 sources.push({league:id,path,sha256:crypto.createHash('sha256').update(raw).digest('hex')});
 const matches=normalizeOpen(JSON.parse(raw),id,'2025-26',new Date().toISOString()).filter(m=>m.status==='FINISHED'&&Number.isInteger(m.hg)&&Number.isInteger(m.ag)).sort((a,b)=>a.date.localeCompare(b.date));
 const validationDate=matches[Math.floor(matches.length*.6)].date,testDate=matches[Math.floor(matches.length*.8)].date;
 const observations=matches.filter(m=>m.date>=validationDate).map(m=>{const model=fit(matches,m);return model?{date:m.date,p:keys.map(k=>model.probabilities[k]),y:m.hg>m.ag?0:m.hg===m.ag?1:2}:null}).filter(Boolean);
 const val=observations.filter(m=>m.date<testDate),test=observations.filter(m=>m.date>=testDate);
 // The baseline wins ties; parameters are chosen only on dates before the test boundary.
 const tuning=temperatures.map(t=>({temperature:t,logloss:mean(val.map(m=>score(transform(m.p,t),m.y)),'logloss')})).sort((a,b)=>a.logloss-b.logloss||Math.abs(a.temperature-1)-Math.abs(b.temperature-1));
 const chosen=tuning[0].temperature;
 const rows=test.map(m=>{const base=score(m.p,m.y),candidate=score(transform(m.p,chosen),m.y);const r={date:m.date,base,candidate};paired.push(r);return r});
 leagues.push({league:id,validationN:val.length,testN:test.length,validationStart:validationDate,testStart:testDate,testEnd:test.at(-1)?.date,temperature:chosen,baselineBrier:mean(rows.map(r=>r.base),'brier'),candidateBrier:mean(rows.map(r=>r.candidate),'brier'),baselineLogloss:mean(rows.map(r=>r.base),'logloss'),candidateLogloss:mean(rows.map(r=>r.candidate),'logloss'),tuning});
}
const byDate=new Map();for(const r of paired){if(!byDate.has(r.date))byDate.set(r.date,[]);byDate.get(r.date).push(r.candidate.logloss-r.base.logloss)}
const blocks=[...byDate.values()];let seed=20260920;const rnd=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296};const differences=[];for(let i=0;i<2000;i++){let n=0,s=0;for(let j=0;j<blocks.length;j++){const b=blocks[Math.floor(rnd()*blocks.length)];n+=b.length;s+=b.reduce((a,v)=>a+v,0)}differences.push(s/n)}differences.sort((a,b)=>a-b);
const report={generatedAt:new Date().toISOString(),method:'Température des probabilités 1N2 ; choix par log loss sur validation chronologique 60–80 %, évaluation glissante sur les dates restantes. Aucune journée partagée entre validation et test.',status:'Exploratoire : cette saison a déjà servi à des évaluations. Ce résultat ne constitue pas un test final indépendant.',baseline:'Poisson buts, demi-vie 120 jours, prior 8. Une seule saison : ne reproduit pas entièrement le moteur roulant intersaisons en production.',sources,leagues,summary:{n:paired.length,baselineBrier:mean(paired.map(r=>r.base),'brier'),candidateBrier:mean(paired.map(r=>r.candidate),'brier'),baselineLogloss:mean(paired.map(r=>r.base),'logloss'),candidateLogloss:mean(paired.map(r=>r.candidate),'logloss'),loglossDifferenceInterval:[differences[50],differences[1950]],intervalMethod:'Bootstrap apparié par journée calendaire, 2 000 réplications, graine fixe. Dépendances entre journées non modélisées.'},profit:null,conclusion:'Aucun changement automatique du moteur. Une amélioration des probabilités ne démontre pas de profit ; cotes historiques contemporaines absentes.'};
fs.writeFileSync('docs/calibration-research.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({summary:report.summary,leagues:leagues.map(({league,temperature,testN,baselineLogloss,candidateLogloss})=>({league,temperature,testN,baselineLogloss,candidateLogloss}))},null,2));
