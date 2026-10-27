import { criarOpcoesCors, origensPermitidas } from './cors.config.js';

describe('cors.config', () => {
  it('libera qualquer origem quando FRONTEND_URL não está definida', () => {
    expect(criarOpcoesCors(undefined)).toEqual({ origin: '*' });
    expect(criarOpcoesCors('   ')).toEqual({ origin: '*' });
  });

  it('restringe às origens informadas em FRONTEND_URL', () => {
    expect(criarOpcoesCors('https://eduroom.vercel.app')).toEqual({
      origin: ['https://eduroom.vercel.app'],
    });
  });

  it('aceita vários endereços e remove a barra do final', () => {
    expect(origensPermitidas(' https://a.com/ , https://b.com ')).toEqual([
      'https://a.com',
      'https://b.com',
    ]);
  });
});
