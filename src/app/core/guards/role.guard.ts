import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const roleGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const userRole = localStorage.getItem('role');

  const expectedRole = route.data['role'] as string | string[];

  if (!expectedRole) {
    return true;
  }

  if (userRole) {
    if (Array.isArray(expectedRole)) {
      if (expectedRole.includes(userRole)) {
        return true;
      }
    } else {
      if (expectedRole === userRole) {
        return true;
      }
    }
  }

  // Redirect unauthorized user to their respective dashboard
  if (userRole === 'ADMIN') {
    router.navigate(['/dashboard']);
  } else if (userRole === 'CITIZEN') {
    router.navigate(['/citizen/dashboard']);
  } else if (userRole === 'VOLUNTEER') {
    router.navigate(['/volunteerhub']);
  } else {
    router.navigate(['/login']);
  }
  return false;
};
