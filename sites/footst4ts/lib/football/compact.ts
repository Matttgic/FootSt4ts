import {freshQuote} from './presentation.ts';
import type {Quote} from './core.ts';
// Preserve market/line/outcome identity, prefer current quotes to stale maxima.
export function compactQuotes(quotes:Quote[],now=Date.now()){
 const best=new Map<string,Quote>();
 for(const q of quotes){const key=JSON.stringify([q.matchId,q.market,q.outcome,q.point??null]);const old=best.get(key);if(!old||(freshQuote(q,now)&&!freshQuote(old,now))||(freshQuote(q,now)===freshQuote(old,now)&&q.price>old.price))best.set(key,q)}
 return [...best.values()];
}
export function summaryHistory(rows:any[]){return rows.map(({payload,...row})=>{let p:any={};try{p=JSON.parse(payload)}catch{}return {...row,payload:JSON.stringify({matchLabel:p.matchLabel,probabilities:p.probabilities})}})}
export function oddsWindow(matches:{utc:string|null;status:string;league:string}[],league:string,now=Date.now()){return matches.some(m=>m.league===league&&['TIMED','SCHEDULED'].includes(m.status)&&m.utc&&Date.parse(m.utc)>now&&Date.parse(m.utc)-now<=90*60000)}
