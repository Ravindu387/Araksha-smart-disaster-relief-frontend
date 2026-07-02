import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

export interface LatLng {
  latitude: number;
  longitude: number;
}

export interface RouteResponse {
  startAddress: string;
  endAddress: string;
  polyline: string;
  distanceKm: number;
  durationMinutes: number;
  coordinates: LatLng[];
}

export interface NearbyShelter {
  shelterId: number;
  name: string;
  address: string;
  distanceKm: number;
  durationMinutes: number;
  capacity: number;
  occupied: number;
  status: string;
  latitude: number;
  longitude: number;
  redirectionTarget?: string;
  redirectLat?: number;
  redirectLng?: number;
}

export interface NearestVolunteer {
  volunteerId: number;
  name: string;
  phone: string;
  rating: number;
  skills: string[];
  status: string;
  distanceKm: number;
  durationMinutes: number;
  latitude: number;
  longitude: number;
}

export interface HazardZone {
  name: string;
  latitude: number;
  longitude: number;
  radiusKm: number;
  description: string;
}

@Injectable({
  providedIn: 'root'
})
export class MapsService {
  private baseMapsUrl = `${environment.apiUrl}/maps`;
  private baseWeatherUrl = `${environment.apiUrl}/weather`;

  constructor(private http: HttpClient) {}

  geocodeAddress(address: string): Observable<LatLng> {
    const params = new HttpParams().set('address', address);
    return this.http.get<LatLng>(`${this.baseMapsUrl}/location`, { params });
  }

  reverseGeocode(lat: number, lng: number): Observable<{ message: string }> {
    const params = new HttpParams()
      .set('lat', lat.toString())
      .set('lng', lng.toString());
    return this.http.get<{ message: string }>(`${this.baseMapsUrl}/location`, { params });
  }

  getRoute(startLat: number, startLng: number, endLat: number, endLng: number): Observable<RouteResponse> {
    const params = new HttpParams()
      .set('startLat', startLat.toString())
      .set('startLng', startLng.toString())
      .set('endLat', endLat.toString())
      .set('endLng', endLng.toString());
    return this.http.get<RouteResponse>(`${this.baseMapsUrl}/route`, { params });
  }

  getNearbyShelters(lat: number, lng: number): Observable<NearbyShelter[]> {
    const params = new HttpParams()
      .set('lat', lat.toString())
      .set('lng', lng.toString());
    return this.http.get<NearbyShelter[]>(`${this.baseMapsUrl}/nearby-shelters`, { params });
  }

  getNearestVolunteer(requestId: number): Observable<NearestVolunteer> {
    const params = new HttpParams().set('requestId', requestId.toString());
    return this.http.get<NearestVolunteer>(`${this.baseMapsUrl}/nearest-volunteer`, { params });
  }

  getHazardZones(): Observable<HazardZone[]> {
    return this.http.get<HazardZone[]>(`${this.baseWeatherUrl}/hazards`);
  }

  registerAidItem(item: any): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/aid/register`, item);
  }

  getAidMatches(lat: number, lng: number, type: string): Observable<any[]> {
    const params = new HttpParams()
      .set('lat', lat.toString())
      .set('lng', lng.toString())
      .set('type', type);
    return this.http.get<any[]>(`${environment.apiUrl}/aid/matches`, { params });
  }

  getMultiRoute(startLat: number, startLng: number, incidentIds: number[]): Observable<RouteResponse> {
    const ids = incidentIds.join(',');
    const params = new HttpParams()
      .set('startLat', startLat.toString())
      .set('startLng', startLng.toString())
      .set('incidentIds', ids);
    return this.http.get<RouteResponse>(`${this.baseMapsUrl}/multi-route`, { params });
  }

  auditShelterCapacity(id: number, occupied: number): Observable<any> {
    const params = new HttpParams().set('occupied', occupied.toString());
    return this.http.post<any>(`${environment.apiUrl}/shelters/${id}/audit`, {}, { params });
  }
}
