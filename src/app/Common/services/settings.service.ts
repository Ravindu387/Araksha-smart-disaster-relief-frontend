import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Settings } from '../models/settings.model';

@Injectable({
  providedIn: 'root'
})
export class SettingsService {

  private http = inject(HttpClient);

  private readonly apiUrl = 'http://localhost:8080/api/settings';

  getSettings(): Observable<Settings> {
    return this.http.get<Settings>(this.apiUrl);
  }

  updateSettings(settings: Settings): Observable<Settings> {
    return this.http.put<Settings>(this.apiUrl, settings);
  }

}