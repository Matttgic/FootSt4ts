import test from 'node:test';import assert from 'node:assert/strict';
import {marketReference} from '../lib/football/market-reference.ts';
const now=Date.now(),q={matchId:'m',source:'s',bookmaker:'b',market:'h2h',outcome:'home',price:2,updatedAt:new Date(now).toISOString()};
const full=[q,{...q,outcome:'draw',price:3},{...q,outcome:'away',price:4}];
test('normalise complete same bookmaker market',()=>assert.ok(Math.abs(marketReference(q,full,now).p-6/13)<1e-12));
test('reject incomplete, ambiguous, stale and mixed bookmaker markets',()=>{for(const rows of [full.slice(0,2),[...full,q],full.map((r,i)=>i===1?{...r,bookmaker:'other'}:r),full.map((r,i)=>i===1?{...r,updatedAt:new Date(now-61000).toISOString()}:r)])assert.equal(marketReference(q,rows,now),null)});
test('do not combine different totals lines or player markets',()=>{const over={...q,market:'totals',outcome:'Over',point:2.5};assert.equal(marketReference(over,[over,{...over,outcome:'Under',point:1.5}],now),null);assert.equal(marketReference({...q,market:'scorer'},full,now),null)});
