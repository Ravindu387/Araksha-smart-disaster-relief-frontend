import { Routes } from '@angular/router';

import { LandingPage } from './Common/landing-page/landing-page';
import { Login } from './Common/login/login';
import { SignupComponent } from './Common/signup/signup';
import { VolunteerDashboardComponent } from './Volunteers/Component/volunteer-dashboard/volunteer-dashboard';

import { AdminLayout } from './Admin/Componet/layouts/admin-layout/admin-layout';

import { Dashboard } from './Admin/Componet/pages/dashboard/dashboard';
import { EmergencyRequestsComponent } from './Admin/Componet/pages/emergency-requests.component/emergency-requests.component';
import { VolunteersComponent } from './Admin/Componet/pages/volunteers.component/volunteers.component';
import { Shelters } from './Admin/Componet/pages/shelters/shelters';
import { Inventory } from './Admin/Componet/pages/inventory/inventory';
import { AllocationComponent } from './Admin/Componet/pages/allocation/allocation';
import { NotificationsComponent } from './Admin/Componet/pages/notifications/notification';
//import { ReportsComponent, LiveTrackingComponent } from './Admin/Componet/pages/reports/reports';
import { Settings } from './Admin/Componet/pages/settings/settings';

import { Layout as CitizenLayout } from './Citizen/Component/Layout/layout/layout';
import { CitizenDashboard } from './Citizen/Component/Pages/Dashboard/citizen-dashboard/citizen-dashboard';

export const routes: Routes = [
  { path: '', redirectTo: 'LandingPage', pathMatch: 'full' },

  { path: 'LandingPage', component: LandingPage },
  { path: 'login', component: Login },
  { path: 'signup', component: SignupComponent },
  { path: 'volunteerhub', component: VolunteerDashboardComponent },

  {
    path: 'citizen',
    component: CitizenLayout,
    children: [
      { path: 'dashboard', component: CitizenDashboard },
    ],
  },

  {
    path: '',
    component: AdminLayout,
    children: [
      { path: 'dashboard', component: Dashboard },
      { path: 'emergency-requests', component: EmergencyRequestsComponent },
      { path: 'volunteers', component: VolunteersComponent },
      { path: 'shelters', component: Shelters },
      { path: 'inventory', component: Inventory },
      { path: 'allocation', component: AllocationComponent },
     // { path: 'live-tracking', component: LiveTrackingComponent },
      { path: 'notifications', component: NotificationsComponent },
     // { path: 'reports', component: ReportsComponent },
      { path: 'settings', component: Settings },
    ],
  },

  { path: '**', redirectTo: 'dashboard' },
];