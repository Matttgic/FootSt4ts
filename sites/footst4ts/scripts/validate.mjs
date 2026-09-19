import fs from 'node:fs';import {normalizeOpen,walkForward} from '../lib/football/core.ts';
const results=['en.1','fr.1','es.1','it.1','de.1'].map(id=>({league:id,...walkForward(normalizeOpen(JSON.parse(fs.readFileSync(`data/2025-26-${id}.json`)),id,'2025-26','2026-09-17T00:00:00Z'))}));
fs.writeFileSync('docs/validation.json',JSON.stringify({generatedAt:new Date().toISOString(),version:'poisson-v1',results},null,2));console.log(results.map(({league,n,brier,logloss})=>({league,n,brier,logloss})));
