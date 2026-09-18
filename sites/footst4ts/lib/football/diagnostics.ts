import {database} from './store';
import {secret} from './secrets';
import {parisDate,seasonFor} from './core';
export async function diagnostics(){const rows=(await database().prepare("SELECT key,collected_at,error,expires_at FROM cache WHERE key LIKE 'fd:%' OR key LIKE 'odds:%' OR key LIKE 'players:%' ORDER BY key").all()).results;return {rows,playerSeason:await secret('PLAYER_SEASON')||seasonFor(parisDate()).slice(0,4),selectionStatus:'Moteur expérimental : recommandations désactivées tant que son incertitude et ses seuils ne sont pas validés. Les clés seules ne les activent pas.'}}
