import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { EmergencyRequest } from '../models/emergency-request.model';

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

/** Parameters accepted by the emergency-requests search endpoint */
export interface EmergencySearchParams {
  keyword?: string;
  status?: string;
  priority?: string;
  disasterType?: string;
  district?: string;
  dateFrom?: string;    // ISO date string yyyy-MM-dd
  dateTo?: string;      // ISO date string yyyy-MM-dd
  page?: number;
  size?: number;
  sort?: string;        // e.g. 'requestTime,desc' | 'priority,asc'
}

@Injectable({
  providedIn: 'root'
})
export class EmergencyRequestService {

  private http = inject(HttpClient);

  private readonly apiUrl = 'http://3.7.133.86:8080/api/emergency-requests';

  // ── Existing methods (unchanged) ──────────────────────────────────────────

  // GET ALL
  getAllRequests(): Observable<EmergencyRequest[]> {
    return this.http.get<EmergencyRequest[]>(this.apiUrl);
  }

  // GET BY ID
  getRequest(id: number): Observable<EmergencyRequest> {
    return this.http.get<EmergencyRequest>(`${this.apiUrl}/${id}`);
  }

  // CREATE
  addRequest(request: EmergencyRequest): Observable<EmergencyRequest> {

    return this.http.post<EmergencyRequest>(this.apiUrl, {

      requestId: request.requestId,

      citizenName: request.citizenName,

      emergencyType: request.emergencyType,

      priority: request.priority,

      status: request.status,

      location: request.location,

      assignedVolunteer: request.assignedVolunteer,

      disasterImageUrl: request.disasterImageUrl,

      documentUrl: request.documentUrl

    });

  }

  // UPDATE
  updateRequest(id: number, request: EmergencyRequest): Observable<EmergencyRequest> {

    return this.http.put<EmergencyRequest>(`${this.apiUrl}/${id}`, {

      requestId: request.requestId,

      citizenName: request.citizenName,

      emergencyType: request.emergencyType,

      priority: request.priority,

      status: request.status,

      location: request.location,

      assignedVolunteer: request.assignedVolunteer,

      disasterImageUrl: request.disasterImageUrl,

      documentUrl: request.documentUrl

    });

  }


  // DELETE
  deleteRequest(id: number): Observable<void> {

    return this.http.delete<void>(`${this.apiUrl}/${id}`);

  }

  // ── New: server-side search with pagination ───────────────────────────────

  /**
   * Calls GET /api/emergency-requests/search with optional filters and pagination.
   * Returns a Spring Page<EmergencyRequestResponse> wrapped in PageResponse.
   */
  searchRequests(params: EmergencySearchParams): Observable<PageResponse<EmergencyRequest>> {
    let httpParams = new HttpParams();

    if (params.keyword?.trim())     httpParams = httpParams.set('keyword',     params.keyword.trim());
    if (params.status?.trim())      httpParams = httpParams.set('status',      params.status.trim());
    if (params.priority?.trim())    httpParams = httpParams.set('priority',    params.priority.trim());
    if (params.disasterType?.trim())httpParams = httpParams.set('disasterType',params.disasterType.trim());
    if (params.district?.trim())    httpParams = httpParams.set('district',    params.district.trim());
    if (params.dateFrom?.trim())    httpParams = httpParams.set('dateFrom',    params.dateFrom.trim());
    if (params.dateTo?.trim())      httpParams = httpParams.set('dateTo',      params.dateTo.trim());

    httpParams = httpParams.set('page', String(params.page ?? 0));
    httpParams = httpParams.set('size', String(params.size ?? 6));

    if (params.sort) httpParams = httpParams.set('sort', params.sort);

    return this.http.get<PageResponse<EmergencyRequest>>(`${this.apiUrl}/search`, { params: httpParams });
  }
}