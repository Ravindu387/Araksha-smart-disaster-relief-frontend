import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Citizen } from '../models/citizen';

@Injectable({
  providedIn: 'root'
})
export class CitizenService {

  private apiUrl = 'http://localhost:8080/api/citizens';

  constructor(private http: HttpClient) {}

  getCitizenById(id: number): Observable<Citizen> {
    return this.http.get<Citizen>(`${this.apiUrl}/${id}`);
  }

  getAllCitizens(): Observable<Citizen[]> {
    return this.http.get<Citizen[]>(this.apiUrl);
  }

  createCitizen(citizen: Citizen): Observable<Citizen> {
    return this.http.post<Citizen>(this.apiUrl, citizen);
  }

  updateCitizen(id: number, citizen: Citizen): Observable<Citizen> {
    return this.http.put<Citizen>(`${this.apiUrl}/${id}`, citizen);
  }

  deleteCitizen(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

}