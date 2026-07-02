import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

export interface WeatherInfo {
  city: string;
  temperature: number;
  description: string;
  rainProbability: number;
  windSpeed: number;
  humidity: number;
  warnings: string;
}

@Injectable({
  providedIn: 'root'
})
export class WeatherService {
  private apiUrl = `${environment.apiUrl}/weather`;

  constructor(private http: HttpClient) {}

  getWeatherByCity(city: string): Observable<WeatherInfo> {
    const params = new HttpParams().set('city', city);
    return this.http.get<WeatherInfo>(this.apiUrl, { params });
  }

  getWeatherByCoords(lat: number, lon: number): Observable<WeatherInfo> {
    const params = new HttpParams()
      .set('lat', lat.toString())
      .set('lon', lon.toString());
    return this.http.get<WeatherInfo>(this.apiUrl, { params });
  }
}
