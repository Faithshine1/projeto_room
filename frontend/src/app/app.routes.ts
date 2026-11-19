
import { Routes } from '@angular/router';
import { adminGuard } from './admin/guards/admin.guard';
import { autenticadoGuard } from './guards/auth.guard';
import { LoginComponent } from './pages/login/login';
import { DashboardComponent } from './pages/dashboard/dashboard';
import { MinhasReservasComponent } from './components/minhas-reservas/minhas-reservas';
import { AgendaSemanalComponent } from './components/agenda-semanal/agenda-semanal';




export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/login').then(
        (m) => m.LoginComponent
      ),
  },
  {
    path: 'dashboard',
    canActivate: [autenticadoGuard],
    loadComponent: () =>
      import('./pages/dashboard/dashboard').then(
        (m) => m.DashboardComponent
      ),
  },
  {

path: 'admin',
  canActivate: [adminGuard],
  loadComponent: () => import('./admin/admin').then((m) => m.Admin),

  },
  {

    path: 'agendamentos',
    canActivate: [autenticadoGuard],
    loadComponent: () => import('./components/agenda-semanal/agenda-semanal').then(m => m.AgendaSemanalComponent)
  },
  {
    path: 'minhas-reservas',
    canActivate: [autenticadoGuard],
    loadComponent: () => import('./components/minhas-reservas/minhas-reservas').then(m => m.MinhasReservasComponent)
  },

  {
  path: 'leitor-qr',
  canActivate: [autenticadoGuard],
  loadComponent: () =>
    import('./pages/leitor-qr/leitor-qr')
      .then(m => m.LeitorQrComponent),
},

  {
    path: '**',
    redirectTo: 'login'
  },


];





  

