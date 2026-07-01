import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface RegisterPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: string; // must match backend Role enum constant, e.g. "CITIZEN" | "VOLUNTEER"
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  email: string;
  role: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private baseUrl = `${environment.apiUrl}/auth`;

  constructor(private http: HttpClient) {}
  register(payload: RegisterPayload): Observable<string> {
    return this.http.post(`${this.baseUrl}/register`, payload, { responseType: 'text' });
  }

  login(payload: LoginPayload): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.baseUrl}/login`, payload);
  }
}