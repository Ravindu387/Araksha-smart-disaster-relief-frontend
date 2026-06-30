import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Shelter, ShelterDTO } from '../Common/models/shelter.model';

@Injectable({
  providedIn: 'root'
})
export class ShelterService {

  private baseUrl = 'http://localhost:8080/api/shelters';

  constructor(private http: HttpClient) {}

  private toShelter(dto: ShelterDTO): Shelter {
    return {
      ...dto,
      status: dto.status as Shelter['status'] ?? 'Available',
      amenities: dto.amenities
        ? dto.amenities.split(',').map(a => a.trim()).filter(a => a.length > 0)
        : []
    };
  }

  private toDTO(shelter: Partial<Shelter>): ShelterDTO {
    return {
      ...shelter,
      amenities: (shelter.amenities ?? []).join(', ')
    } as ShelterDTO;
  }

  getAll(): Observable<Shelter[]> {
    return this.http.get<ShelterDTO[]>(this.baseUrl)
      .pipe(map(list => list.map(dto => this.toShelter(dto))));
  }

  getShelters(): Observable<Shelter[]> {
    return this.getAll();
  }

  getById(id: number): Observable<Shelter> {
    return this.http.get<ShelterDTO>(`${this.baseUrl}/${id}`)
      .pipe(map(dto => this.toShelter(dto)));
  }

  create(shelter: Partial<Shelter>): Observable<Shelter> {
    return this.http.post<ShelterDTO>(this.baseUrl, this.toDTO(shelter))
      .pipe(map(dto => this.toShelter(dto)));
  }

  update(id: number, shelter: Partial<Shelter>): Observable<Shelter> {
    return this.http.put<ShelterDTO>(`${this.baseUrl}/${id}`, this.toDTO(shelter))
      .pipe(map(dto => this.toShelter(dto)));
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}