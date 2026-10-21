
import { Routes } from '@angular/router';
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
    loadComponent: () =>
      import('./pages/dashboard/dashboard').then(
        (m) => m.DashboardComponent
      ),
  },
  {
    path: 'admin',
    loadComponent: () =>
      import('./admin/admin').then(
        (m) => m.Admin
      ),
  },
  {
    path: '**',
    redirectTo: 'login',
  },
{
    path: 'agendamentos',
    loadComponent: () => import('./components/agenda-semanal/agenda-semanal').then(m => m.AgendaSemanalComponent)
  },
  {
    path: 'minhas-reservas',
    loadComponent: () => import('./components/minhas-reservas/minhas-reservas').then(m => m.MinhasReservasComponent)
  },
  {
    path: '**',
    redirectTo: 'login'
  }


];


