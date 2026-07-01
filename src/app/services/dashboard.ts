import { Injectable } from '@angular/core';

import { HttpClient } from '@angular/common/http';

import { Observable } from 'rxjs';

import { environment } from '../environments/environment';
@Injectable({
  providedIn: 'root'
})
export class DashboardService {

  private api = environment.apiUrl;

  constructor(private http: HttpClient) { }

  getVolunteer(id:number):Observable<any>{

      return this.http.get(`${this.api}/volunteers/${id}`);

  }

  getStats(id:number):Observable<any>{

      return this.http.get(`${this.api}/dashboard/stats/${id}`);

  }

  getAssignedTasks(id:number):Observable<any>{

      return this.http.get(`${this.api}/tasks/assigned/${id}`);

  }

  getOpenRequests():Observable<any>{

      return this.http.get(`${this.api}/requests/open`);

  }

  getEmergency(id:number):Observable<any>{

      return this.http.get(`${this.api}/emergency/${id}`);

  }

  getWeeklyPerformance(id:number):Observable<any>{

      return this.http.get(`${this.api}/performance/weekly/${id}`);

  }

  getCompletedTasks(id:number):Observable<any>{

      return this.http.get(`${this.api}/tasks/completed/${id}`);

  }

}
