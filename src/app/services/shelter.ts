import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ShelterService {

  private api = 'http://localhost:8080/api/shelters';

  constructor(private http: HttpClient) {}

  getShelters(): Observable<any> {
    return this.http.get(this.api);
  }

  registerShelter(data: any): Observable<any> {
    return this.http.post(this.api, data);
  }

  deleteShelter(id: number): Observable<any> {
    return this.http.delete(`${this.api}/${id}`);
  }

  searchShelters(keyword: string): Observable<any> {
    return this.http.get(`${this.api}/search?keyword=${keyword}`);
  }

  getByStatus(status: string): Observable<any> {
    return this.http.get(`${this.api}/status/${status}`);
  }
}
