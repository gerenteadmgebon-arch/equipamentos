import {readFileSync, mkdtempSync, writeFileSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
const html = readFileSync('public/index.html','utf8');
const config = JSON.parse(readFileSync('firebase.json','utf8'));
assert.equal(config.hosting.site,'gebon-testes-firestore');
assert.equal(config.hosting.public,'public');
assert.deepEqual(Object.keys(config),['hosting']);
assert(html.includes('signInWithEmailAndPassword'), 'Login ausente');
assert(html.includes('browserLocalPersistence'), 'Persistência de login ausente');
assert(html.includes('AKfycbyqoXw774q3ySRmW2ARUuKzUUQGTsdetrnZ8Su0wXMPzvqeoMscvf9hnbVlitTQeAUc'), 'Backend incorreto');
assert(html.includes('connection-state129'), 'Indicador de conexão ausente');
assert(!html.includes('Personalizar layout'), 'Editor removido reapareceu');
assert(!/-----BEGIN (?:RSA )?PRIVATE KEY-----/.test(html),'Credencial privada no HTML');
const temp = mkdtempSync(join(tmpdir(),'gebon-validate-'));
let count=0;
try {
  for (const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)) {
    if (/\bsrc\s*=/.test(match[1])) continue;
    const type = /\btype\s*=\s*["']([^"']*)["']/i.exec(match[1])?.[1];
    if(type && !['module','text/javascript','application/javascript'].includes(type)) continue;
    const file=join(temp,`script-${++count}.${type==='module'?'mjs':'cjs'}`);
    writeFileSync(file,match[2]);
    execFileSync(process.execPath,['--check',file],{stdio:'pipe'});
  }
  assert(count>0,'Nenhum script encontrado');
  console.log(`Validação concluída: ${count} scripts; destino, autenticação e configuração conferidos.`);
} finally { rmSync(temp,{recursive:true,force:true}); }
