import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { EmergencyRequest } from '../models/emergency-request.model';

export interface VolunteerHubResponse {
  id: number;
  volunteerCode: string;
  name: string;
  status: string;
  available: boolean;
}

export interface TaskResponse {
  id: number;
  taskCode: string;
  name: string;
  location: string;
  distance: string;
  eta: string;
  priority: string;
  status: string;
}

@Injectable({
  providedIn: 'root'
})
export class VolunteerHubService {
  private http = inject(HttpClient);

  private readonly hubApiUrl = 'http://localhost:8080/api/volunteerhub';
  private readonly tasksApiUrl = 'http://localhost:8080/api/tasks';
  private readonly requestsApiUrl = 'http://localhost:8080/api/emergency-requests';

  // GET VOLUNTEER BY EMAIL
  getVolunteerByEmail(email: string): Observable<VolunteerHubResponse> {
    return this.http.get<VolunteerHubResponse>(`${this.hubApiUrl}/by-email/${email}`);
  }

  // GET TASKS ASSIGNED TO VOLUNTEER
  getTasksForVolunteer(volunteerId: number): Observable<TaskResponse[]> {
    return this.http.get<TaskResponse[]>(`${this.tasksApiUrl}/volunteer/${volunteerId}`);
  }

  // ASSIGN AN EMERGENCY REQUEST TO VOLUNTEER
  assignRequestToVolunteer(request: {
    taskCode: string;
    name: string;
    location: string;
    distance: string;
    eta: string;
    priority: string;
    status: string;
    volunteerId: number;
    emergencyRequestId: number;
  }): Observable<TaskResponse> {
    return this.http.post<TaskResponse>(this.tasksApiUrl, request);
  }

  // COMPLETE A TASK
  completeTask(taskId: number): Observable<TaskResponse> {
    return this.http.put<TaskResponse>(`${this.tasksApiUrl}/${taskId}/complete`, {});
  }

  // GET ALL EMERGENCY REQUESTS
  getAllEmergencyRequests(): Observable<EmergencyRequest[]> {
    return this.http.get<EmergencyRequest[]>(this.requestsApiUrl);
  }
}
