import { Routes } from '@angular/router';
import { LandingPage } from './Common/landing-page/landing-page';
import { AdminLayout } from './Admin/Componet/layouts/admin-layout/admin-layout';
import { Dashboard } from './Admin/Componet/pages/dashboard/dashboard';
import { Inventory } from './pages/dashboard/inventory/inventory';

export const routes: Routes = [
  {
    path: '',
    component: LandingPage
  },
  {
    path: 'admin',
    component: AdminLayout,
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        component: Dashboard
      },
      {
        path: 'inventory',
        component: Inventory
      }
    ]
  }
];