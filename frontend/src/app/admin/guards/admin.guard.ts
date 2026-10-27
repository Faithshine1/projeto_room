import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID, inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

// Só deixa entrar em /admin quem fez login como administrador.
// Qualquer outra pessoa que digitar /admin na barra de endereço volta para o login.
export const adminGuard: CanActivateFn = () => {
  const router = inject(Router);

  // No servidor (SSR/prerender) não existe localStorage; a checagem real
  // acontece no navegador.
  if (!isPlatformBrowser(inject(PLATFORM_ID))) {
    return true;
  }

  try {
    const usuario = JSON.parse(localStorage.getItem('usuario') ?? 'null');

    if (usuario?.perfil === 'admin') {
      return true;
    }
  } catch {
    // JSON inválido no localStorage: trata como não autenticado
  }

  return router.createUrlTree(['/login']);
};