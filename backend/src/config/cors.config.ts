// Define quais sites podem chamar a API (CORS).
//
// FRONTEND_URL aceita um ou vários endereços separados por vírgula, por exemplo:
//   FRONTEND_URL=https://eduroom.vercel.app
//   FRONTEND_URL=https://eduroom.vercel.app,https://www.meusite.com.br
//
// Se FRONTEND_URL não estiver definida (ex.: no seu computador), a API aceita
// qualquer origem, que é o comportamento que o projeto já tinha.

export function origensPermitidas(valor: string | undefined): string[] {
  return (valor ?? '')
    .split(',')
    .map((origem) => origem.trim().replace(/\/+$/, '')) // tira a "/" do final
    .filter((origem) => origem.length > 0);
}

export function criarOpcoesCors(frontendUrl: string | undefined) {
  const origens = origensPermitidas(frontendUrl);

  if (origens.length === 0) {
    return { origin: '*' as const };
  }

  return { origin: origens };
}
