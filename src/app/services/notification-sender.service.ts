import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

export interface SmsPayload {
  phoneNumber: string;
  message: string;
}

export interface EmailPayload {
  to: string;
  subject: string;
  body: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationSenderService {
  private baseSmsUrl = `${environment.apiUrl}/sms/send`;
  private baseEmailUrl = `${environment.apiUrl}/email/send`;

  constructor(private http: HttpClient) {}

  sendSms(payload: SmsPayload): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(this.baseSmsUrl, payload);
  }

  sendEmail(payload: EmailPayload): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(this.baseEmailUrl, payload);
  }
}
