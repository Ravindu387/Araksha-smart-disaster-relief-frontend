import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
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

/** Shape of Spring's Page<T> response */
export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

/** Parameters accepted by the inventory search endpoint */
export interface InventorySearchParams {
  keyword?: string;
  category?: string;
  stockStatus?: string;   // 'available' | 'low' | 'out'
  page?: number;
  size?: number;
  sort?: string;          // e.g. 'name,asc' | 'count,desc'
}

@Injectable({
  providedIn: 'root'
})
export class InventoryService {

  private apiUrl = 'http://localhost:8080/api/inventory';


  constructor(private http: HttpClient) {}

  // ── Existing methods (unchanged) ──────────────────────────────────────────

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

  // ── New: server-side search with pagination ───────────────────────────────

  /**
   * Calls GET /api/inventory/search with optional filters and pagination.
   * Returns a Spring Page<Inventory> wrapped in PageResponse.
   */
  searchInventory(params: InventorySearchParams): Observable<PageResponse<Inventory>> {
    let httpParams = new HttpParams();

    if (params.keyword?.trim())     httpParams = httpParams.set('keyword',     params.keyword.trim());
    if (params.category?.trim())    httpParams = httpParams.set('category',    params.category.trim());
    if (params.stockStatus?.trim()) httpParams = httpParams.set('stockStatus', params.stockStatus.trim());

    httpParams = httpParams.set('page', String(params.page ?? 0));
    httpParams = httpParams.set('size', String(params.size ?? 10));

    if (params.sort) httpParams = httpParams.set('sort', params.sort);

    return this.http.get<PageResponse<Inventory>>(`${this.apiUrl}/search`, { params: httpParams });
  }
}