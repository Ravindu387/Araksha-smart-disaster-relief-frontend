import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ForgotPasswordService {

  private apiUrl = 'http://localhost:8080/api/auth';

  constructor(private http: HttpClient) {}

  // Send OTP
  sendOtp(email: string): Observable<string> {
  return this.http.post(`${this.apiUrl}/forgot-password`, {
    email: email
  }, {
    responseType: 'text'
  });
}
// Verify OTP
verifyOtp(email: string, otp: string): Observable<string> {
  return this.http.post(
    `${this.apiUrl}/verify-otp`,
    {
      email: email,
      otp: otp
    },
    {
      responseType: 'text'
    }
  );
}

  // Reset Password
  resetPassword(
  email: string,
  otp: string,
  newPassword: string
): Observable<string> {

  return this.http.post(
    `${this.apiUrl}/reset-password`,
    {
      email,
      otp,
      newPassword
    },
    {
      responseType: 'text'
    }
  );
}
}