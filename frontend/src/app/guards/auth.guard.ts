import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID, inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

// Exige estar logado (professor ou gestor). Senão, volta para o login.
export const autenticadoGuard: CanActivateFn = () => {
  // No servidor (SSR) não há localStorage; a checagem real é no navegador.
  if (!isPlatformBrowser(inject(PLATFORM_ID))) return true;

  return inject(AuthService).logado ? true : inject(Router).createUrlTree(['/login']);
};
