// Planifier ce script depuis un ordonnanceur HTTPS autorisé ; aucune clé fournisseur ici.
const origin=process.env.SITE_ORIGIN,token=process.env.COLLECT_TOKEN;
if(!origin||!token)throw Error('SITE_ORIGIN et COLLECT_TOKEN requis');
if(!origin.startsWith('https://'))throw Error('HTTPS requis');
const r=await fetch(new URL('/api/collect',origin),{method:'POST',headers:{Authorization:`Bearer ${token}`},signal:AbortSignal.timeout(120000)});
if(!r.ok)throw Error(`Collecte refusée (${r.status})`);console.log('Collecte terminée');
