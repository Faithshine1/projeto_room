import type { INestApplication } from '@nestjs/common';
import type { IncomingMessage, ServerResponse } from 'node:http';

type Manipulador = (req: IncomingMessage, res: ServerResponse) => void;

// Na Vercel o backend roda como função: o main.ts precisa EXPORTAR este handler.
// O app Nest é criado uma vez e reaproveitado; se falhar, a próxima requisição tenta de novo.
export function criarHandler(criarApp: () => Promise<INestApplication>) {
  let pronto: Promise<Manipulador> | undefined;

  const iniciar = async (): Promise<Manipulador> => {
    const app = await criarApp();
    await app.init();
    return app.getHttpAdapter().getInstance() as Manipulador;
  };

  return async function handler(req: IncomingMessage, res: ServerResponse) {
    if (!pronto) {
      pronto = iniciar().catch((erro: unknown) => {
        pronto = undefined;
        throw erro;
      });
    }

    const servidor = await pronto;
    return servidor(req, res);
  };
}