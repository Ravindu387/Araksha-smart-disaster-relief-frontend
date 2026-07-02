import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Shelter, ShelterDTO } from '../Common/models/shelter.model';

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

/** Parameters accepted by the shelters search endpoint */
export interface ShelterSearchParams {
  keyword?: string;
  status?: string;
  minCapacity?: number;
  maxCapacity?: number;
  page?: number;
  size?: number;
  sort?: string;       // e.g. 'capacity,desc' | 'name,asc'
}

@Injectable({
  providedIn: 'root'
})
export class ShelterService {

  private baseUrl = 'http://localhost:8080/api/shelters';

  constructor(private http: HttpClient) {}

  // ── Conversion helpers (unchanged) ────────────────────────────────────────

  private toShelter(dto: ShelterDTO): Shelter {
    return {
      ...dto,
      status: dto.status as Shelter['status'] ?? 'Available',
      amenities: dto.amenities
        ? dto.amenities.split(',').map(a => a.trim()).filter(a => a.length > 0)
        : []
    };
  }

  private toDTO(shelter: Partial<Shelter>): ShelterDTO {
    return {
      ...shelter,
      amenities: (shelter.amenities ?? []).join(', ')
    } as ShelterDTO;
  }

  // ── Existing methods (unchanged) ──────────────────────────────────────────

  getAll(): Observable<Shelter[]> {
    return this.http.get<ShelterDTO[]>(this.baseUrl)
      .pipe(map(list => list.map(dto => this.toShelter(dto))));
  }

  getShelters(): Observable<Shelter[]> {
    return this.getAll();
  }

  getById(id: number): Observable<Shelter> {
    return this.http.get<ShelterDTO>(`${this.baseUrl}/${id}`)
      .pipe(map(dto => this.toShelter(dto)));
  }

  create(shelter: Partial<Shelter>): Observable<Shelter> {
    return this.http.post<ShelterDTO>(this.baseUrl, this.toDTO(shelter))
      .pipe(map(dto => this.toShelter(dto)));
  }

  update(id: number, shelter: Partial<Shelter>): Observable<Shelter> {
    return this.http.put<ShelterDTO>(`${this.baseUrl}/${id}`, this.toDTO(shelter))
      .pipe(map(dto => this.toShelter(dto)));
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  // ── New: server-side search with pagination ───────────────────────────────

  /**
   * Calls GET /api/shelters/search with optional filters and pagination.
   * Maps each ShelterDTO in the Page content to a Shelter.
   */
  searchShelters(params: ShelterSearchParams): Observable<PageResponse<Shelter>> {
    let httpParams = new HttpParams();

    if (params.keyword?.trim()) httpParams = httpParams.set('keyword', params.keyword.trim());
    if (params.status?.trim())  httpParams = httpParams.set('status',  params.status.trim());
    if (params.minCapacity != null) httpParams = httpParams.set('minCapacity', String(params.minCapacity));
    if (params.maxCapacity != null) httpParams = httpParams.set('maxCapacity', String(params.maxCapacity));

    httpParams = httpParams.set('page', String(params.page ?? 0));
    httpParams = httpParams.set('size', String(params.size ?? 10));

    if (params.sort) httpParams = httpParams.set('sort', params.sort);

    return this.http.get<PageResponse<ShelterDTO>>(`${this.baseUrl}/search`, { params: httpParams })
      .pipe(
        map(page => ({
          ...page,
          content: page.content.map(dto => this.toShelter(dto))
        }))
      );
  }
}