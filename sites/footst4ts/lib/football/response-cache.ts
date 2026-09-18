import {waitUntil} from 'cloudflare:workers';
import {database,readCache,lock} from './store';
export async function responseCache(key:string,build:()=>Promise<Response>,ttl=300000){const headers={'Cache-Control':'private, no-store'};let old:any;try{old=await readCache(key)}catch{return build()}
 const refresh=async()=>{const response=await build();if(!response.ok)return response;const data:any=await response.json();if(data.dbError)return Response.json(data,{headers});if(key.includes(':match:')&&!data.detail)return Response.json(data,{headers});data.generatedAt=new Date().toISOString();await database().prepare('INSERT INTO cache(key,payload,collected_at,expires_at,error) VALUES(?,?,?,?,NULL) ON CONFLICT(key) DO UPDATE SET payload=excluded.payload,collected_at=excluded.collected_at,expires_at=excluded.expires_at,error=NULL').bind(key,JSON.stringify(data),data.generatedAt,Date.now()+ttl).run();return Response.json(data,{headers})};
 if(old?.data){if(old.expires_at<Date.now()&&await lock('view:'+key,30000))waitUntil(refresh().catch(()=>undefined));return Response.json({...old.data,viewStale:old.expires_at<Date.now()},{headers})}
 return refresh();}
