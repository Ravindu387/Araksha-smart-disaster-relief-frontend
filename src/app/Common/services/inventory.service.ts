import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Inventory {

  id?: number;

  name: string;

  category: string;

  count: number;

  total: number;

  unit: string;

  allocated: number;

  minStock: number;

}

@Injectable({
  providedIn: 'root'
})
export class InventoryService {

  private apiUrl = 'http://localhost:8080/api/inventory';


  constructor(private http: HttpClient) {}

  getAllInventory(): Observable<Inventory[]> {
    return this.http.get<Inventory[]>(this.apiUrl);
  }

  getInventory(id: number): Observable<Inventory> {
    return this.http.get<Inventory>(`${this.apiUrl}/${id}`);
  }

  addInventory(item: Inventory): Observable<Inventory> {
    return this.http.post<Inventory>(this.apiUrl, item);
  }

  updateInventory(id: number, item: Inventory): Observable<Inventory> {
    return this.http.put<Inventory>(`${this.apiUrl}/${id}`, item);
  }

  deleteInventory(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

}