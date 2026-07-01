import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface RecentAllocation {
  id?: number;
  message: string;
  time: string;
  type: 'volunteer' | 'resource' | 'shelter' | 'info';
}

@Injectable({
  providedIn: 'root'
})
export class AllocationService {

  private http = inject(HttpClient);

  private readonly apiUrl = 'http://localhost:8080/api/allocations';

  getAllAllocations(): Observable<RecentAllocation[]> {
    return this.http.get<RecentAllocation[]>(this.apiUrl);
  }

  createAllocation(allocation: RecentAllocation): Observable<RecentAllocation> {
    return this.http.post<RecentAllocation>(this.apiUrl, allocation);
  }
}