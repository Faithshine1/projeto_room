import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID, inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

// Só deixa entrar em /admin quem está logado como GESTOR.
// Professor ou visitante que digitar /admin volta para o login.
export const adminGuard: CanActivateFn = () => {
  // No servidor (SSR/prerender) não existe localStorage; a checagem real
  // acontece no navegador.
  if (!isPlatformBrowser(inject(PLATFORM_ID))) {
    return true;
  }

  return inject(AuthService).ehGestor ? true : inject(Router).createUrlTree(['/login']);
};
