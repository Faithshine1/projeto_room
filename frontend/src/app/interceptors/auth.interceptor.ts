import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { environment } from '../../environments/environment';
import { AuthService } from '../services/auth.service';

// Envia o token (Bearer) em toda chamada HttpClient para a nossa API
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(AuthService).token;

  if (token && req.url.startsWith(environment.apiUrl)) {
    req = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  }
  return next(req);
};
