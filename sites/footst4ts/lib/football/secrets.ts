import {database,setting} from './store';
import {unseal} from './crypto';
export const secretNames=['FOOTBALL_DATA_KEY','ODDS_API_KEY','API_FOOTBALL_KEY','API_FOOTBALL_RIGHTS_CONFIRMED'] as const;
export async function secret(name:string){if(setting(name))return setting(name);if(!setting('CREDENTIALS_MASTER_KEY'))return '';const row=await database().prepare('SELECT ciphertext FROM credentials WHERE name=?').bind(name).first<{ciphertext:string}>();return row?unseal(row.ciphertext,setting('CREDENTIALS_MASTER_KEY'),name):''}
