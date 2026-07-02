import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

/**
 * ForgotPasswordService provides API calls for the 3-step password reset flow:
 *   1. sendOtp(email)                          → POST /api/auth/forgot-password
 *   2. verifyOtp(email, otp)                   → POST /api/auth/verify-otp
 *   3. resetPassword(email, otp, newPassword)  → POST /api/auth/reset-password
 */
@Injectable({ providedIn: 'root' })
export class ForgotPasswordService {

  private readonly baseUrl = 'http://localhost:8080/api/auth';

  constructor(private http: HttpClient) {}

  /** Step 1 – Send OTP to the given email */
  sendOtp(email: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.baseUrl}/forgot-password`,
      { email }
    );
  }

  /** Step 2 – Verify the 6-digit OTP the user typed */
  verifyOtp(email: string, otp: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.baseUrl}/verify-otp`,
      { email, otp }
    );
  }

  /** Step 3 – Reset password with the verified OTP and new password */
  resetPassword(email: string, otp: string, newPassword: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.baseUrl}/reset-password`,
      { email, otp, newPassword }
    );
  }
}
