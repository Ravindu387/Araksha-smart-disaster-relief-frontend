import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface SchedulerJob {
  id: number;
  jobKey: string;
  name: string;
  cronExpression: string;
  lastRun: string | null;
  nextRun: string | null;
  status: 'ACTIVE' | 'PAUSED';
  totalRuns: number;
  failedRuns: number;
  lastRunStatus: 'SUCCESS' | 'FAILED' | null;
}

export interface SchedulerLog {
  id: number;
  jobName: string;
  executionTime: string;
  durationMs: number;
  status: 'SUCCESS' | 'FAILED';
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class SchedulerService {
  private http = inject(HttpClient);
  private baseUrl = 'http://3.7.133.86:8080/api/scheduler';

  getJobs(): Observable<SchedulerJob[]> {
    return this.http.get<SchedulerJob[]>(`${this.baseUrl}/jobs`);
  }

  getLogs(): Observable<SchedulerLog[]> {
    return this.http.get<SchedulerLog[]>(`${this.baseUrl}/logs`);
  }

  runJob(jobKey: string): Observable<string> {
    return this.http.post(`${this.baseUrl}/run/${jobKey}`, {}, { responseType: 'text' });
  }

  toggleJobStatus(jobKey: string, status: 'ACTIVE' | 'PAUSED'): Observable<SchedulerJob> {
    return this.http.post<SchedulerJob>(`${this.baseUrl}/jobs/${jobKey}/toggle`, { status });
  }

  updateJob(jobKey: string, cronExpression: string, status: 'ACTIVE' | 'PAUSED'): Observable<SchedulerJob> {
    return this.http.put<SchedulerJob>(`${this.baseUrl}/jobs/${jobKey}`, { cronExpression, status });
  }
}
