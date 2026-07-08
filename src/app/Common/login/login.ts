import { Component, inject, AfterViewInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators, FormsModule } from '@angular/forms';
import { AuthService, LoginPayload } from '../../core/service/auth.service';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

declare var google: any;

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login implements AfterViewInit {

  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  // Google OAuth properties
  googleToken = '';
  showRoleSelection = false;
  googleUserEmail = '';
  googleUserFirstName = '';
  googleUserLastName = '';
  selectedRole = 'CITIZEN';
  googlePhone = '';

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]]
  });

  ngAfterViewInit() {
    this.initializeGoogleSignIn();
  }

  initializeGoogleSignIn() {
    if (typeof google !== 'undefined') {
      google.accounts.id.initialize({
        client_id: '730458745418-c1k9cnnna2ir3bc0rh89k6is05706n9m.apps.googleusercontent.com',
        callback: this.handleCredentialResponse.bind(this)
      });
      google.accounts.id.renderButton(
        document.getElementById('google-btn'),
        { theme: 'outline', size: 'large' }
      );
    } else {
      setTimeout(() => this.initializeGoogleSignIn(), 500);
    }
  }

  handleCredentialResponse(response: any) {
    const idToken = response.credential;
    this.googleToken = idToken;
    this.authService.googleLogin(idToken).subscribe({
      next: (res: any) => {
        if (res.registered) {
          this.completeLogin(res);
        } else {
          this.googleUserEmail = res.email;
          this.googleUserFirstName = res.firstName;
          this.googleUserLastName = res.lastName;
          this.showRoleSelection = true;
        }
      },
      error: (err) => {
        alert(err.error || 'Google Sign-In failed');
      }
    });
  }

  selectRole(role: string) {
    this.selectedRole = role;
  }

  submitGoogleRegistration() {
    if (!this.googleToken) return;
    this.authService.googleRegister(this.googleToken, this.selectedRole, this.googlePhone).subscribe({
      next: (res: any) => {
        this.completeLogin(res);
      },
      error: (err) => {
        alert(err.error || 'Google Registration failed');
      }
    });
  }

  completeLogin(res: any) {
    localStorage.setItem('token', res.token);
    localStorage.setItem('email', res.email);
    localStorage.setItem('role', res.role);

    console.log('Login Success');
    const role = localStorage.getItem('role');

    if (role === 'ADMIN') {
      this.router.navigate(['/dashboard']);
    } else if (role === 'CITIZEN') {
      this.router.navigate(['/citizen/dashboard']);
    } else {
      this.router.navigate(['/volunteerhub']);
    }
  }

  login() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const payload: LoginPayload = {
      email: this.loginForm.value.email ?? '',
      password: this.loginForm.value.password ?? ''
    };

    this.authService.login(payload).subscribe({
      next: (res: any) => {
        this.completeLogin(res);
      },
      error: (err) => {
        alert(err.error?.error || 'Invalid email or password');
      }
    });
  }
}