import {playerOverview} from '@/lib/football/players';
export async function GET(){try{return Response.json(await playerOverview(),{headers:{'Cache-Control':'private, no-store'}})}catch{return Response.json({error:'Statistiques joueurs indisponibles. Réessayez plus tard.'},{status:503})}}
