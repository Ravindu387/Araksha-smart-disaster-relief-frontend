import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/service/auth.service';

type Role = 'Citizen' | 'Volunteer';

interface SignupModel {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  agree: boolean;
}

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './signup.html'
})
export class SignupComponent {
  step = 1;
  selectedRole: Role | null = null;
  isSubmitting = false;
  errorMessage = '';

  user: SignupModel = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    agree: false
  };

  constructor(private authService: AuthService, private router: Router) { }

  get hasMinLength(): boolean {
    return (this.user.password || '').length >= 8;
  }

  get hasUppercase(): boolean {
    return /[A-Z]/.test(this.user.password || '');
  }

  get hasLowercase(): boolean {
    return /[a-z]/.test(this.user.password || '');
  }

  get hasNumber(): boolean {
    return /[0-9]/.test(this.user.password || '');
  }

  get hasSpecial(): boolean {
    return /[!@#$%^&*(),.?":{}|<>]/.test(this.user.password || '');
  }

  get isPasswordValid(): boolean {
    return this.hasMinLength && this.hasUppercase && this.hasLowercase && this.hasNumber && this.hasSpecial;
  }

  selectRole(role: Role) {
    this.selectedRole = role;
    this.errorMessage = '';
  }

  nextStep() {
    if (!this.selectedRole) {
      this.errorMessage = 'Please select a role.';
      return;
    }
    if (!this.user.firstName || !this.user.lastName || !this.user.email) {
      this.errorMessage = 'Please fill in all required fields.';
      return;
    }
    this.errorMessage = '';
    this.step = 2;
  }

  previousStep() {
    this.errorMessage = '';
    this.step = 1;
  }

  submit() {
    if (!this.user.agree || !this.selectedRole || this.isSubmitting) {
      return;
    }

    if (!this.isPasswordValid) {
      this.errorMessage = 'Password must meet all complexity requirements.';
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    // NOTE: backend RegisterRequest/User currently have no "phone" field,
    // so it isn't sent. Add a `phone` column to User + RegisterRequest
    // on the backend if you want to persist it.
    this.authService
      .register({
        firstName: this.user.firstName,
        lastName: this.user.lastName,
        email: this.user.email,
        password: this.user.password,
        role: this.selectedRole.toUpperCase() // must match backend Role enum names
      })
      .subscribe({
        next: (message: any) => {
          this.isSubmitting = false;
          if (message === 'Email already exists') {
            this.errorMessage = message;
            return;
          }
          this.router.navigate(['/login']);
        },
        error: (err: any) => {
          this.isSubmitting = false;
          this.errorMessage = 'Something went wrong. Please try again.';
          console.error(err);
        }
      });
  }
}