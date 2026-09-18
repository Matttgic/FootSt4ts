export const LEAGUES = [
 {id:'fr.1',name:'Ligue 1',country:'France',fd:'FL1',api:61,odds:'soccer_france_ligue_one'},
 {id:'en.1',name:'Premier League',country:'Angleterre',fd:'PL',api:39,odds:'soccer_epl'},
 {id:'es.1',name:'La Liga',country:'Espagne',fd:'PD',api:140,odds:'soccer_spain_la_liga'},
 {id:'it.1',name:'Serie A',country:'Italie',fd:'SA',api:135,odds:'soccer_italy_serie_a'},
 {id:'de.1',name:'Bundesliga',country:'Allemagne',fd:'BL1',api:78,odds:'soccer_germany_bundesliga'},
];
export type Match = {id:string;league:string;season:string;date:string;utc:string|null;home:string;away:string;homeId:string;awayId:string;homeAliases?:string[];awayAliases?:string[];hg:number|null;ag:number|null;status:string;source:string;collectedAt:string;round:string|null};
export type Quote = {matchId:string;market:string;outcome:string;price:number;bookmaker:string;updatedAt:string;collectedAt:string;source:string;point?:number};
export function parisDate(instant:Date|string = new Date()){ return new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Paris',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(instant)); }
export function validDate(s:string){return /^\d{4}-\d{2}-\d{2}$/.test(s)&&!isNaN(Date.parse(s))&&new Date(s).toISOString().slice(0,10)===s}
export function shiftDay(day:string,delta:number){const d=new Date(day+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+delta);return d.toISOString().slice(0,10)}
export function seasonFor(day:string){const y=Number(day.slice(0,4))-(Number(day.slice(5,7))<7?1:0);return `${y}-${String(y+1).slice(-2)}`}
export function normalizeOpen(raw:any,league:string,season:string,collectedAt:string):Match[]{
 if(!Array.isArray(raw.matches))throw new Error('Format fournisseur invalide');
 return raw.matches.filter((m:any)=>validDate(m.date)&&typeof m.team1==='string'&&typeof m.team2==='string').map((m:any,i:number)=>{
 const ft=Array.isArray(m.score)?m.score:m.score?.ft;const scored=Array.isArray(ft)&&ft.length===2&&ft.every((x:any)=>Number.isInteger(x)&&x>=0);
 // Names are source-local labels only; never used to join different providers or seasons.
 const prefix=`openfootball:${league}:${season}:`;
 return {id:prefix+String(m.round??'')+':'+m.team1+':'+m.team2,league,season,date:m.date,utc:null,home:m.team1,away:m.team2,homeId:prefix+m.team1,awayId:prefix+m.team2,hg:scored?ft[0]:null,ag:scored?ft[1]:null,status:scored?'FINISHED':'SCHEDULED',source:'OpenFootball',collectedAt,round:m.round??null};});
}
export function poisson(lambda:number,tail=1e-10){if(!Number.isFinite(lambda)||lambda<0||lambda>20)throw new Error('Intensité invalide');const a=[Math.exp(-lambda)];let s=a[0];for(let k=1;s<1-tail&&k<160;k++){a.push(a[k-1]*lambda/k);s+=a[k]}return {values:a,mass:s}}
export function markets(home:number,away:number){const h=poisson(home),a=poisson(away);let H=0,D=0,A=0,btts=0,o15=0,o25=0;const mass=h.mass*a.mass;
 h.values.forEach((x,i)=>a.values.forEach((y,j)=>{const p=x*y/mass;if(i>j)H+=p;else if(i===j)D+=p;else A+=p;if(i&&j)btts+=p;if(i+j>1)o15+=p;if(i+j>2)o25+=p}));
 return {home:H,draw:D,away:A,'1X':H+D,'X2':D+A,'12':H+A,over15:o15,under15:1-o15,over25:o25,under25:1-o25,btts,noBtts:1-btts,truncatedMass:1-mass};}
export function fit(matches:Match[],target:Match,params={halfLife:120,prior:8}){
 const cutoff=Date.parse(target.date);const rows=matches.filter(m=>m.league===target.league&&m.season===target.season&&m.status==='FINISHED'&&m.hg!==null&&m.ag!==null&&Date.parse(m.date)<cutoff);
 if(rows.length<30)return null;
 const weight=(m:Match)=>Math.exp(-Math.LN2*(cutoff-Date.parse(m.date))/86400000/params.halfLife);
 const sum=rows.reduce((s,m)=>s+weight(m),0),lh=rows.reduce((s,m)=>s+weight(m)*m.hg!,0)/sum,la=rows.reduce((s,m)=>s+weight(m)*m.ag!,0)/sum;
 if(!lh||!la)return null;
 const home=rows.filter(m=>m.homeId===target.homeId),away=rows.filter(m=>m.awayId===target.awayId);
 if(home.length<5||away.length<5)return null;
 const rate=(rs:Match[],key:'hg'|'ag',prior:number)=>(rs.reduce((s,m)=>s+weight(m)*m[key]!,0)+params.prior*prior)/(rs.reduce((s,m)=>s+weight(m),0)+params.prior);
 const lambdaHome=rate(home,'hg',lh)*rate(away,'hg',lh)/lh,lambdaAway=rate(away,'ag',la)*rate(home,'ag',la)/la;
 if(lambdaHome>20||lambdaAway>20)return null;
 return {version:'poisson-v1',params,lambdaHome,lambdaAway,probabilities:markets(lambdaHome,lambdaAway),n:rows.length,homeN:home.length,awayN:away.length,uncertainty:'Non quantifiée : aucune recommandation automatique',cutoff:target.date,experimental:true};
}
export function form(matches:Match[],teamId:string,date:string,n=5,venue='all'){
 const rows=matches.filter(m=>m.status==='FINISHED'&&m.hg!==null&&m.ag!==null&&m.date<date&&(venue==='home'?m.homeId===teamId:venue==='away'?m.awayId===teamId:m.homeId===teamId||m.awayId===teamId)).sort((a,b)=>b.date.localeCompare(a.date)).slice(0,n);
 if(!rows.length)return {n:0,goalsFor:null,goalsAgainst:null,btts:null,over25:null,results:[]};
 return {n:rows.length,goalsFor:rows.reduce((s,m)=>s+(m.homeId===teamId?m.hg!:m.ag!),0)/rows.length,goalsAgainst:rows.reduce((s,m)=>s+(m.homeId===teamId?m.ag!:m.hg!),0)/rows.length,btts:rows.filter(m=>m.hg!>0&&m.ag!>0).length/rows.length,over25:rows.filter(m=>m.hg!+m.ag!>2).length/rows.length,results:rows.map(m=>({date:m.date,opponent:m.homeId===teamId?m.away:m.home,gf:m.homeId===teamId?m.hg:m.ag,ga:m.homeId===teamId?m.ag:m.hg}))};
}
export function noVig(prices:number[]){if(prices.length<2||prices.some(c=>!Number.isFinite(c)||c<=1))throw new Error('Marché incomplet ou invalide');const s=prices.reduce((a,c)=>a+1/c,0);return prices.map(c=>1/c/s)}
export function expectedValue(p:number,c:number){if(p<0||p>1||!Number.isFinite(p)||!Number.isFinite(c)||c<=1)throw new Error('Valeur invalide');return p*c-1}
export function playerProbability(rate90:number,scenarios:{probability:number;minutes:number}[]){if(rate90<0||!Number.isFinite(rate90)||scenarios.some(s=>s.probability<0||s.minutes<0||s.minutes>90)||Math.abs(scenarios.reduce((s,x)=>s+x.probability,0)-1)>1e-8)throw new Error('Scénarios invalides');return scenarios.reduce((p,s)=>p+s.probability*(-Math.expm1(-rate90*s.minutes/90)),0)}
export function eligibility(p:number,quote:Quote|null,quality:{n:number;uncertainty:number|null;validated:boolean},now=Date.now(),config={minN:100,maxUncertainty:.08,minEV:.05,maxAgeMinutes:120}){if(!quote)return 'Cote réelle non disponible';if(!quality.validated||quality.uncertainty===null)return 'Modèle expérimental : incertitude non validée';if(quality.n<config.minN||quality.uncertainty>config.maxUncertainty)return 'Données insuffisantes';const age=now-Date.parse(quote.updatedAt);if(!Number.isFinite(age)||age<0||age>config.maxAgeMinutes*60000)return 'Cote ancienne';return expectedValue(p,quote.price)>=config.minEV?null:'Avantage insuffisant'}
export function walkForward(matches:Match[],predictor:typeof fit=fit){const rows=matches.filter(m=>m.status==='FINISHED'&&m.hg!==null&&m.ag!==null).sort((a,b)=>a.date.localeCompare(b.date));const bins=Array.from({length:10},()=>({n:0,sumP:0,sumY:0}));let n=0,brier=0,logloss=0,naive=0,frequencyBrier=0;const losses:{date:string;loss:number}[]=[];const split=Math.floor(rows.length*.8),start=Math.floor(rows.length*.6);
 for(let i=start;i<rows.length;i++){const m=rows[i],model=predictor(rows,m);if(!model)continue;const ps=[model.probabilities.home,model.probabilities.draw,model.probabilities.away],y=m.hg!>m.ag!?0:m.hg===m.ag?1:2;if(i<split)continue;n++;const loss=ps.reduce((s,p,k)=>s+(p-Number(k===y))**2,0);brier+=loss;losses.push({date:m.date,loss});const past=rows.filter(x=>x.date<m.date&&x.league===m.league);const counts=[1,1,1];for(const x of past)counts[x.hg!>x.ag!?0:x.hg===x.ag?1:2]++;frequencyBrier+=counts.reduce((s,c,k)=>s+(c/(past.length+3)-Number(k===y))**2,0);logloss-=Math.log(Math.max(ps[y],1e-15));naive+=2/3;ps.forEach((p,k)=>{const b=bins[Math.min(9,Math.floor(p*10))];b.n++;b.sumP+=p;b.sumY+=Number(k===y)})}
 const groups=Object.values(losses.reduce((g,r)=>{(g[r.date]??=[]).push(r.loss);return g},{} as Record<string,number[]>));let seed=20260918;const rng=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296};const samples:number[]=[];if(groups.length>1)for(let b=0;b<500;b++){let total=0,count=0;for(let j=0;j<groups.length;j++){const block=groups[Math.floor(rng()*groups.length)];total+=block.reduce((s,x)=>s+x,0);count+=block.length}samples.push(total/count)}samples.sort((a,b)=>a-b);
 return {testCandidates:rows.length-split,skipped:rows.length-split-n,testStart:rows[split]?.date??null,testEnd:rows.at(-1)?.date??null,frequencyBrier:n?frequencyBrier/n:null,naiveLogloss:Math.log(3),brierInterval:samples.length?[samples[12],samples[487]]:null,n,brier:n?brier/n:null,logloss:n?logloss/n:null,naiveBrier:n?naive/n:null,bins:bins.map(b=>({n:b.n,p:b.n?b.sumP/b.n:null,observed:b.n?b.sumY/b.n:null})),roi:null,drawdown:null,bets:0,marketComparison:null,method:'60 % initial, 20 % validation réservée, 20 % test glissant. Paramètres fixes ; résultats rétrospectifs, versions historiques des sources non disponibles.'};}
