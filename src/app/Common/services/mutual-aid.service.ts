import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface MutualAidItem {
  id?: number;
  citizenName: string;
  itemType: string;
  description: string;
  contactPhone: string;
  latitude: number;
  longitude: number;
  type: 'OFFER' | 'NEED';
  createdAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class MutualAidService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/external/aid`;

  registerAidItem(item: MutualAidItem): Observable<MutualAidItem> {
    return this.http.post<MutualAidItem>(`${this.baseUrl}/register`, item);
  }

  getAidMatches(lat: number, lng: number, type: 'OFFER' | 'NEED'): Observable<MutualAidItem[]> {
    return this.http.get<MutualAidItem[]>(`${this.baseUrl}/matches?lat=${lat}&lng=${lng}&type=${type}`);
  }
}
