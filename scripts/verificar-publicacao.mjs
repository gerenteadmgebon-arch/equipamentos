import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const target='https://gebon-testes-firestore.web.app/';
const hash=data=>createHash('sha256').update(data).digest('hex');
const expected=hash(readFileSync('public/index.html'));
let confirmed=false;
for(let attempt=1;attempt<=6;attempt++){
  try {
    const response=await fetch(target,{headers:{'Cache-Control':'no-cache'},signal:AbortSignal.timeout(20000)});
    if(!response.ok) throw new Error(`HTTP ${response.status}`);
    const actual=hash(Buffer.from(await response.arrayBuffer()));
    if(actual===expected){confirmed=true;console.log(`Publicação confirmada: SHA-256 ${expected}`);break;}
    console.error(`Tentativa ${attempt}: o conteúdo ainda não corresponde ao pacote.`);
  } catch(error) { console.error(`Tentativa ${attempt}: ${error.message}`); }
  if(attempt<6) await new Promise(resolve=>setTimeout(resolve,5000));
}
if(!confirmed){console.error('A versão pode ter sido publicada, mas a conferência falhou. Verifique o Hosting antes de repetir.');process.exitCode=1;}
