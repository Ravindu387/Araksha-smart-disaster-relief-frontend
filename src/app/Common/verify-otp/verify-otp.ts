import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ForgotPasswordService } from '../../core/service/forgot-password.service';

/**
 * VerifyOtpComponent — Step 2 of the password reset flow.
 *
 * Reads the email from query params (passed from forgot-password page).
 * User types the 6-digit OTP received by email.
 * On success, navigate to /reset-password passing email and otp as query params.
 */
@Component({
  selector: 'app-verify-otp',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './verify-otp.html',
  styleUrl: './verify-otp.css'
})
export class VerifyOtpComponent implements OnInit {

  email = '';
  otp = '';
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private forgotPasswordService: ForgotPasswordService
  ) {}

  ngOnInit(): void {
    // Read email from query params set by forgot-password page
    this.route.queryParams.subscribe(params => {
      this.email = params['email'] || '';
    });
  }

  verifyOtp(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.otp.trim()) {
      this.errorMessage = 'Please enter the OTP sent to your email.';
      return;
    }

    if (this.otp.trim().length !== 6 || !/^\d{6}$/.test(this.otp.trim())) {
      this.errorMessage = 'OTP must be exactly 6 digits.';
      return;
    }

    this.isLoading = true;

    this.forgotPasswordService.verifyOtp(this.email, this.otp.trim()).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.successMessage = res.message;
        setTimeout(() => {
          this.router.navigate(['/reset-password'], {
            queryParams: { email: this.email, otp: this.otp.trim() }
          });
        }, 1000);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.error || 'Invalid OTP. Please try again.';
      }
    });
  }

  /** Resend OTP — goes back to forgot-password page */
  resendOtp(): void {
    this.router.navigate(['/forgot-password']);
  }

  goBack(): void {
    this.router.navigate(['/forgot-password']);
  }
}
