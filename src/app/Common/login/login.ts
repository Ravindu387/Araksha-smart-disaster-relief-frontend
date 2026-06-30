import { Component, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { AuthService } from '../../core/service/auth.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {

  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  });

  login() {

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.authService.login(this.loginForm.value).subscribe({
      next: (res: any) => {

        localStorage.setItem('token', res.token);
        localStorage.setItem('email', res.email);
        localStorage.setItem('role', res.role);

        console.log('Login Success');
        const role = localStorage.getItem('role');

        if (role === 'ADMIN') {
          this.router.navigate(['/admin-dashboard']);
        } else if (role === 'CITIZEN') {
          this.router.navigate(['/citizen/dashboard']);
        } else {
          this.router.navigate(['/volunteerhub']);
  }
      },

      error: (err) => {
        alert(err.error?.error || 'Invalid email or password');
      }
    });
  }
}