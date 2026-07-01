import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { LandingStats } from '../models/landing-stats.model';

@Injectable({
  providedIn: 'root'
})
export class LandingService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8080/api/landing';

  getLandingStats(): Observable<LandingStats> {
    return this.http.get<LandingStats>(`${this.apiUrl}/stats`);
  }
}
