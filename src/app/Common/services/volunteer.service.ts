import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Volunteer } from '../../Common/models/volunteer.model';

/** Shape of Spring's Page<T> response */
export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;       // current page (0-based)
  first: boolean;
  last: boolean;
}

/** Parameters accepted by the search endpoint */
export interface VolunteerSearchParams {
  keyword?: string;
  status?: string;
  district?: string;
  skill?: string;
  page?: number;
  size?: number;
  sort?: string;       // e.g. 'name,asc' | 'tasks,desc'
}

@Injectable({
  providedIn: 'root'
})
export class VolunteerService {

  private http = inject(HttpClient);

  private readonly apiUrl = 'http://localhost:8080/api/volunteers';

  // ── Existing methods (unchanged) ──────────────────────────────────────────

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
      phone: volunteer.phone,
      profilePhotoUrl: volunteer.profilePhotoUrl,
      idVerificationDocUrl: volunteer.idVerificationDocUrl
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
      phone: volunteer.phone,
      profilePhotoUrl: volunteer.profilePhotoUrl,
      idVerificationDocUrl: volunteer.idVerificationDocUrl
    };

    return this.http.put<Volunteer>(
      `${this.apiUrl}/${id}`,
      request
    );
  }


  deleteVolunteer(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // ── New: server-side search with pagination ───────────────────────────────

  /**
   * Calls GET /api/volunteers/search with optional filters and pagination.
   * Returns a Spring Page<VolunteerResponse> wrapped in PageResponse<Volunteer>.
   */
  searchVolunteers(params: VolunteerSearchParams): Observable<PageResponse<Volunteer>> {
    let httpParams = new HttpParams();

    if (params.keyword?.trim())  httpParams = httpParams.set('keyword',  params.keyword.trim());
    if (params.status?.trim())   httpParams = httpParams.set('status',   params.status.trim());
    if (params.district?.trim()) httpParams = httpParams.set('district', params.district.trim());
    if (params.skill?.trim())    httpParams = httpParams.set('skill',    params.skill.trim());

    httpParams = httpParams.set('page', String(params.page ?? 0));
    httpParams = httpParams.set('size', String(params.size ?? 10));

    if (params.sort) httpParams = httpParams.set('sort', params.sort);

    return this.http.get<PageResponse<Volunteer>>(`${this.apiUrl}/search`, { params: httpParams });
  }
}