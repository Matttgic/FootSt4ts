// Budgets extensibles vers le bas uniquement : aucune augmentation au-delà du gratuit.
export const DEFAULT_LIMITS={openDaily:20,calendarDaily:80,calendarMinute:8,oddsMonthly:400,oddsReserve:50,playersDaily:80};
export function boundedBudget(raw:string,defaultValue:number,maximum:number){const n=Number(raw);return raw&&Number.isInteger(n)&&n>=0?Math.min(n,maximum):defaultValue}
export const EXTENSION_CANDIDATES=[{name:'Portugal',fd:'PPL',open:'pt.1'},{name:'Pays-Bas',fd:'DED',open:'nl.1'},{name:'Championship',fd:'ELC',open:'en.2'},{name:'UEFA Champions League',fd:'CL',open:null},{name:'Belgique',fd:null,open:null},{name:'Ligue 2',fd:null,open:'fr.2'},{name:'Bundesliga 2',fd:null,open:'de.2'},{name:'LaLiga 2',fd:null,open:'es.2'},{name:'Serie B',fd:null,open:'it.2'}];
// Candidates are inactive until coverage, rights and budget have been checked.
