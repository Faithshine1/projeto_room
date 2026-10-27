// Gera src/environments/environment.ts a partir da variável de ambiente API_URL.
// Roda sozinho antes de "npm run build" (hook "prebuild" do package.json).
//
// - Na Vercel (VERCEL=1): API_URL é obrigatória, para o site nunca ser publicado
//   apontando para "localhost" por engano.
// - No seu computador: se API_URL não existir, nada muda (continua localhost:3001).

import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const arquivo = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  'src',
  'environments',
  'environment.ts',
);

const naVercel = process.env.VERCEL === '1';
const informada = (process.env.API_URL ?? '').trim();

function falhar(mensagem) {
  console.error(`\n[set-env] ERRO: ${mensagem}\n`);
  process.exit(1);
}

if (!informada) {
  if (naVercel) {
    falhar(
      'a variável API_URL não está definida.\n' +
        '         Na Vercel, abra o projeto do frontend em Settings > Environment Variables\n' +
        '         e crie API_URL com o endereço do backend (ex.: https://eduroom-backend.vercel.app).',
    );
  }
  console.log('[set-env] API_URL não definida; mantendo http://localhost:3001 (ambiente local).');
  process.exit(0);
}

let url;
try {
  url = new URL(informada);
} catch {
  falhar(`API_URL inválida: "${informada}". Use um endereço completo, como https://meu-backend.vercel.app`);
}

if (url.protocol !== 'http:' && url.protocol !== 'https:') {
  falhar(`API_URL deve começar com http:// ou https:// (recebido: "${informada}").`);
}

const local = url.hostname === 'localhost' || url.hostname === '127.0.0.1';
if (naVercel && url.protocol !== 'https:' && !local) {
  falhar(
    `API_URL deve usar https:// (recebido: "${informada}"). ` +
      'O site publicado na Vercel é https e o navegador bloqueia chamadas http.',
  );
}

const apiUrl = informada.replace(/\/+$/, ''); // tira a "/" do final

writeFileSync(
  arquivo,
  `// ARQUIVO GERADO por scripts/set-env.mjs a partir da variável API_URL.\n` +
    `// Para o ambiente local, o valor padrão é http://localhost:3001.\n` +
    `export const environment = {\n  apiUrl: ${JSON.stringify(apiUrl)},\n};\n`,
);

console.log(`[set-env] apiUrl = ${apiUrl}`);
