import type {Quote} from './core.ts';
import {freshQuote} from './presentation.ts';
// No mixing bookmakers, timestamps, markets or lines; ambiguous duplicates are rejected.
export function marketReference(selected:Quote,quotes:Quote[],now=Date.now()){
 const outcomes=selected.market==='h2h'?['home','draw','away']:selected.market==='totals'?['Over','Under']:null;
 if(!outcomes||!outcomes.includes(selected.outcome)||!freshQuote(selected,now))return null;
 const rows=quotes.filter(q=>q.matchId===selected.matchId&&q.source===selected.source&&q.bookmaker===selected.bookmaker&&q.market===selected.market&&q.point===selected.point&&freshQuote(q,now)&&Math.abs(Date.parse(q.updatedAt)-Date.parse(selected.updatedAt))<=60000);
 const market=outcomes.map(o=>rows.filter(q=>q.outcome===o));
 if(market.some(rs=>rs.length!==1))return null;
 const prices=market.map(rs=>rs[0].price);if(prices.some(p=>!Number.isFinite(p)||p<=1))return null;
 const sum=prices.reduce((s,p)=>s+1/p,0);
 return {p:(1/selected.price)/sum,overround:sum-1,bookmaker:selected.bookmaker,updatedAt:selected.updatedAt,method:'Normalisation proportionnelle des issues complètes du même opérateur (≤ 60 s)'};
}
