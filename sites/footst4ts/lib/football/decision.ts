import {freshQuote} from './presentation.ts';
export const STRATEGY='paper-v1';
export const RULES={minLeague:100,minTeam:10,minEV:.05,stressDrop:.05,maxDataHours:12};
const supported=new Set(['home','draw','away','over15','under15','over25','under25']);
export function decide(a:any,now=Date.now()){
 const m=a.match,model=a.model;
 const reject=(reason:string)=>({eligible:false,reason,strategy:STRATEGY,selection:null});
 if(!m?.utc||!Number.isFinite(Date.parse(m.utc))||Date.parse(m.utc)<=now||!['TIMED','SCHEDULED'].includes(m.status))return reject('Match commencé ou horaire non certifié');
 if(!model)return reject('Historique insuffisant pour calculer le modèle');
 if(model.n<RULES.minLeague||model.homeN<RULES.minTeam||model.awayN<RULES.minTeam)return reject('Échantillon trop faible pour le protocole simulé (100 matchs, 10 par équipe dans son contexte)');
 const age=now-Date.parse(m.collectedAt);
 if(!Number.isFinite(age)||age<0||age>RULES.maxDataHours*3600000)return reject('Calendrier et résultats collectés depuis plus de 12 heures');
 const priced=(a.markets??[]).filter((r:any)=>supported.has(r.key)&&r.quote&&r.quote.matchId===m.id&&freshQuote(r.quote,now)&&Number.isFinite(r.p)&&r.p>0&&r.p<1&&Number.isFinite(r.quote.price)&&r.quote.price>1);
 if(!priced.length)return reject('Aucune cote réelle de moins de deux heures pour les marchés étudiés');
 const candidates=priced.map((r:any)=>({...r,ev:r.p*r.quote.price-1,stressP:Math.max(0,r.p-RULES.stressDrop),stressEV:Math.max(0,r.p-RULES.stressDrop)*r.quote.price-1})).filter((r:any)=>r.ev>=RULES.minEV&&r.stressEV>0).sort((a:any,b:any)=>b.stressEV-a.stressEV||a.key.localeCompare(b.key));
 if(!candidates.length)return reject('Avantage insuffisant ou disparaissant avec une probabilité réduite de 5 points');
 const r=candidates[0];return {eligible:true,reason:'Admis au suivi fictif uniquement ; rentabilité non démontrée',strategy:STRATEGY,selection:{market:r.key,p:r.p,marketReference:r.marketReference??null,price:r.quote.price,ev:r.ev,stressP:r.stressP,stressEV:r.stressEV,breakEven:1/r.quote.price,minimumStressPrice:1/r.stressP,bookmaker:r.quote.bookmaker,source:r.quote.source,updatedAt:r.quote.updatedAt,collectedAt:r.quote.collectedAt,stake:1}};
}
export function settle(market:string,h:number,a:number):boolean|null{
 if(!Number.isInteger(h)||!Number.isInteger(a)||h<0||a<0)return null;
 switch(market){case 'home':return h>a;case 'draw':return h===a;case 'away':return h<a;case 'over15':return h+a>1.5;case 'under15':return h+a<1.5;case 'over25':return h+a>2.5;case 'under25':return h+a<2.5;default:return null}
}
export function paperReport(rows:any[]){let profit=0,peak=0,drawdown=0,settled=0,pending=0,wins=0;const entries=[];
 for(const row of [...rows].sort((a,b)=>a.kickoff.localeCompare(b.kickoff)||a.id.localeCompare(b.id))){try{const p=JSON.parse(row.payload),s=p.selection;if(p.kind!=='paper'||!s||!Number.isFinite(s.price)||s.price<=1||!Number.isFinite(Date.parse(row.published_at))||!Number.isFinite(Date.parse(row.kickoff))||Date.parse(row.published_at)>=Date.parse(row.kickoff))continue;const result=row.result?JSON.parse(row.result):null;const won=result?settle(s.market,result.hg,result.ag):null;let net=null;if(won===null)pending++;else{settled++;if(won)wins++;net=won?s.price-1:-1;profit+=net;peak=Math.max(peak,profit);drawdown=Math.max(drawdown,peak-profit)}entries.push({id:row.id,label:p.matchLabel,publishedAt:row.published_at,kickoff:row.kickoff,selection:s,net});}catch{}}
 return {strategy:STRATEGY,settled,pending,wins,profit,roi:settled?profit/settled:null,drawdown,entries:entries.reverse(),limit:1000};
}

export const PRUDENT_STRATEGY='paper-v2-prudent';
export const PRUDENT_RULES={...RULES,maxPrice:5,maxMarketGap:.15,requireMarket:true};
export function decidePrudent(a:any,now=Date.now()){
 const base=decide(a,now);const reject=(reason:string)=>({eligible:false,reason,strategy:PRUDENT_STRATEGY,selection:null});
 if(!base.eligible)return {...base,strategy:PRUDENT_STRATEGY};
 const markets=(a.markets??[]).filter((r:any)=>r.quote&&r.quote.price<=PRUDENT_RULES.maxPrice&&r.marketReference&&Number.isFinite(r.marketReference.p)&&Math.abs(r.p-r.marketReference.p)<=PRUDENT_RULES.maxMarketGap&&!/matchbook|betfair|smarkets|betdaq|exchange/i.test(r.quote.bookmaker??''));
 const guarded=decide({...a,markets},now);
 if(!guarded.eligible)return reject('V2 : pas de candidat après contrôle du marché (écart ≤ 15 points, cote ≤ 5, bourses de paris exclues faute de frais vérifiés)');
 return {...guarded,strategy:PRUDENT_STRATEGY,reason:'Candidat fictif V2 avec filtres supplémentaires ; rentabilité non démontrée'};
}
