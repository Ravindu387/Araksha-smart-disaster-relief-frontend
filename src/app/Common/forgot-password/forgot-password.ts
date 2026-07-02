import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ForgotPasswordService } from '../../core/service/forgot-password.service';

/**
 * ForgotPasswordComponent — Step 1 of the password reset flow.
 *
 * User enters their registered email address and clicks "Send OTP".
 * On success, navigate to /verify-otp passing the email as a query param.
 * On failure, show the server error message.
 */
@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.css'
})
export class ForgotPasswordComponent {

  email = '';
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private forgotPasswordService: ForgotPasswordService,
    private router: Router
  ) {}

  /** Validates the email format before calling the API */
  isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  sendOtp(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.email.trim()) {
      this.errorMessage = 'Please enter your email address.';
      return;
    }

    if (!this.isValidEmail(this.email.trim())) {
      this.errorMessage = 'Please enter a valid email address.';
      return;
    }

    this.isLoading = true;

    this.forgotPasswordService.sendOtp(this.email.trim()).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.successMessage = res.message;
        // Navigate to verify-otp page, pass email as query param
        setTimeout(() => {
          this.router.navigate(['/verify-otp'], {
            queryParams: { email: this.email.trim() }
          });
        }, 1200);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.error || 'Something went wrong. Please try again.';
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/login']);
  }
}
