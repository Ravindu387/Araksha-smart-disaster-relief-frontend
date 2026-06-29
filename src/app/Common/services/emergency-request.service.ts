import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { EmergencyRequest } from '../models/emergency-request.model';

@Injectable({
  providedIn: 'root'
})
export class EmergencyRequestService {

  private http = inject(HttpClient);

  private readonly apiUrl = 'http://localhost:8080/api/emergency-requests';

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

      assignedVolunteer: request.assignedVolunteer

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

      assignedVolunteer: request.assignedVolunteer

    });

  }

  // DELETE
  deleteRequest(id: number): Observable<void> {

    return this.http.delete<void>(`${this.apiUrl}/${id}`);

  }

}