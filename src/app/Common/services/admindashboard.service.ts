import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { DashboardStats } from '../models/admin-dashboard.model';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {

  private http = inject(HttpClient);

  private apiUrl = 'http://localhost:8080/api/dashboard';

  getDashboardStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.apiUrl}/stats`);
  }

}