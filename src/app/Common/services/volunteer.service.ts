import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Volunteer } from '../../Common/models/volunteer.model';

@Injectable({
  providedIn: 'root'
})
export class VolunteerService {

  private http = inject(HttpClient);

  private readonly apiUrl = 'http://localhost:8080/api/volunteers';

  getAllVolunteers(): Observable<Volunteer[]> {
    return this.http.get<Volunteer[]>(this.apiUrl);
  }

  getVolunteer(id: number): Observable<Volunteer> {
    return this.http.get<Volunteer>(`${this.apiUrl}/${id}`);
  }

  addVolunteer(volunteer: Volunteer): Observable<Volunteer> {

    const request = {
      name: volunteer.name,
      location: volunteer.location,
      skills: volunteer.skills,
      status: volunteer.status,
      rating: volunteer.rating,
      tasks: volunteer.tasks,
      phone: volunteer.phone
    };

    return this.http.post<Volunteer>(this.apiUrl, request);
  }

  updateVolunteer(id: number, volunteer: Volunteer): Observable<Volunteer> {

    const request = {
      name: volunteer.name,
      location: volunteer.location,
      skills: volunteer.skills,
      status: volunteer.status,
      rating: volunteer.rating,
      tasks: volunteer.tasks,
      phone: volunteer.phone
    };

    return this.http.put<Volunteer>(
      `${this.apiUrl}/${id}`,
      request
    );
  }

  deleteVolunteer(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}