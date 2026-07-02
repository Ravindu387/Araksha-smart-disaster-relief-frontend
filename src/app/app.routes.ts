import { Routes } from '@angular/router';

import { LandingPage } from './Common/landing-page/landing-page';
import { Login } from './Common/login/login';
import { SignupComponent } from './Common/signup/signup';
import { ForgotPasswordComponent } from './Common/forgot-password/forgot-password';
import { VerifyOtpComponent } from './Common/verify-otp/verify-otp';
import { ResetPasswordComponent } from './Common/reset-password/reset-password';
import { VolunteerDashboardComponent } from './Volunteers/Component/volunteer-dashboard/volunteer-dashboard';

import { AdminLayout } from './Admin/Componet/layouts/admin-layout/admin-layout';

import { Dashboard } from './Admin/Componet/pages/dashboard/dashboard';
import { EmergencyRequestsComponent } from './Admin/Componet/pages/emergency-requests.component/emergency-requests.component';
import { VolunteersComponent } from './Admin/Componet/pages/volunteers.component/volunteers.component';
import { SheltersComponent } from './Admin/Componet/pages/shelters/shelters';
import { Inventory } from './Admin/Componet/pages/inventory/inventory';
import { AllocationComponent } from './Admin/Componet/pages/allocation/allocation';
import { NotificationsComponent } from './Admin/Componet/pages/notifications/notification';
import { ReportsComponent } from './Admin/Componet/pages/reports/reports';
import { LiveTracking } from './Admin/Componet/pages/live-tracking/live-tracking';
import { Settings } from './Admin/Componet/pages/settings/settings';
import { Citizen } from './citizen/citizen';

import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'LandingPage', pathMatch: 'full' },

  { path: 'LandingPage', component: LandingPage },
  { path: 'login', component: Login },
  { path: 'signup', component: SignupComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  { path: 'verify-otp', component: VerifyOtpComponent },
  { path: 'reset-password', component: ResetPasswordComponent },
  {
    path: 'volunteerhub',
    component: VolunteerDashboardComponent,
    canActivate: [authGuard, roleGuard],
    data: { role: 'VOLUNTEER' }
  },

  {
    path: 'citizen',
    canActivate: [authGuard, roleGuard],
    data: { role: 'CITIZEN' },
    children: [
      { path: 'dashboard', component: Citizen },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ],
  },

  {
    path: '',
    component: AdminLayout,
    canActivate: [authGuard, roleGuard],
    data: { role: 'ADMIN' },
    children: [
      { path: 'dashboard', component: Dashboard },
      { path: 'emergency-requests', component: EmergencyRequestsComponent },
      { path: 'volunteers', component: VolunteersComponent },
      { path: 'shelters', component: SheltersComponent },
      { path: 'inventory', component: Inventory },
      { path: 'allocation', component: AllocationComponent },
      { path: 'live-tracking', component: LiveTracking },
      { path: 'notifications', component: NotificationsComponent },
      { path: 'reports', component: ReportsComponent },
      { path: 'settings', component: Settings },
    ],
  },

  { path: '**', redirectTo: 'LandingPage' },
];