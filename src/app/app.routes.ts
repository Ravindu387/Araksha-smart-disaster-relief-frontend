import { Routes } from '@angular/router';

import { LandingPage } from './Common/landing-page/landing-page';

import { Dashboard } from './Admin/Componet/pages/dashboard/dashboard';
//import { EmergencyRequests } from './Admin/Componet/pages/emergency-requests/emergency-requests';
//import { Volunteers } from './Admin/Componet/pages/volunteers/volunteers';
//import { Shelters } from './Admin/Componet/pages/shelters/shelters';
//import { Inventory } from './Admin/Componet/pages/inventory/inventory';
//import { Allocation } from './Admin/Componet/pages/allocation/allocation';
//import { LiveTracking } from './Admin/Componet/pages/live-tracking/live-tracking';
//import { Notifications } from './Admin/Componet/pages/notifications/notifications';
//import { Reports } from './Admin/Componet/pages/reports/reports';
//import { Settings } from './Admin/Componet/pages/settings/settings';

export const routes: Routes = [
  { path: '', redirectTo: 'LandingPage', pathMatch: 'full' },

  {path: 'LandingPage',component: LandingPage},
  { path: 'dashboard', component: Dashboard },
  // { path: 'emergency-requests', component: EmergencyRequests },
  // { path: 'volunteers', component: Volunteers },
  // { path: 'shelters', component: Shelters },
  // { path: 'inventory', component: Inventory },
  // { path: 'allocation', component: Allocation },
  // { path: 'live-tracking', component: LiveTracking },
  // { path: 'notifications', component: Notifications },
  // { path: 'reports', component: Reports },
  // { path: 'settings', component: Settings },

  { path: '**', redirectTo: 'dashboard' }
];