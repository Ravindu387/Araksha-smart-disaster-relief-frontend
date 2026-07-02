import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ForgotPasswordService } from '../../core/service/forgot-password.service';

/**
 * ResetPasswordComponent — Step 3 of the password reset flow.
 *
 * Reads email and otp from query params (set by verify-otp page).
 * User enters a new password and confirm password.
 * Full password strength validation matching the signup page.
 * On success, navigate to /login.
 */
@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './reset-password.html',
  styleUrl: './reset-password.css'
})
export class ResetPasswordComponent implements OnInit {

  email = '';
  otp = '';
  newPassword = '';
  confirmPassword = '';

  isLoading = false;
  errorMessage = '';
  successMessage = '';
  passwordMismatch = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private forgotPasswordService: ForgotPasswordService
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.email = params['email'] || '';
      this.otp   = params['otp'] || '';
    });
  }

  // ─── Password strength getters (mirrors signup.ts exactly) ───────────────

  get hasMinLength(): boolean {
    return (this.newPassword?.length ?? 0) >= 8;
  }

  get hasUppercase(): boolean {
    return /[A-Z]/.test(this.newPassword || '');
  }

  get hasLowercase(): boolean {
    return /[a-z]/.test(this.newPassword || '');
  }

  get hasNumber(): boolean {
    return /\d/.test(this.newPassword || '');
  }

  get hasSpecial(): boolean {
    return /[!@#$%^&*(),.?":{}|<>]/.test(this.newPassword || '');
  }

  get isPasswordValid(): boolean {
    return this.hasMinLength && this.hasUppercase && this.hasLowercase && this.hasNumber && this.hasSpecial;
  }

  // ─────────────────────────────────────────────────────────────────────────

  resetPassword(): void {
    this.errorMessage = '';
    this.successMessage = '';
    this.passwordMismatch = false;

    if (!this.newPassword) {
      this.errorMessage = 'Please enter a new password.';
      return;
    }

    if (!this.isPasswordValid) {
      this.errorMessage = 'Password must meet all complexity requirements.';
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.errorMessage = 'Passwords do not match.';
      this.passwordMismatch = true;
      return;
    }

    this.isLoading = true;

    this.forgotPasswordService.resetPassword(this.email, this.otp, this.newPassword).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.successMessage = res.message;
        // Give user 1.5 seconds to see success, then redirect to login
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 1500);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.error || 'Something went wrong. Please try again.';
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/verify-otp'], {
      queryParams: { email: this.email }
    });
  }
}
