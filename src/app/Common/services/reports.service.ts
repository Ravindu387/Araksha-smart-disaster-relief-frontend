import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

// ─────────────────────────────────────────────────────────────────────────────
// INTERFACES — These match the exact JSON shape that Spring Boot sends back
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Matches ReportsSummaryResponse.java in the backend.
 * One KPI stat card.
 */
export interface ApiStatCard {
  title: string;
  value: string;
  change: string;
  isPositive: boolean;  // Note: Spring Boot serializes "isPositive" as "positive" by default
  positive: boolean;    // Jackson getter name — we handle both
  type: string;         // "incidents" | "resolved" | "volunteers" | "response"
}

/**
 * Matches DisasterCategoryDto.java in the backend.
 * One row in the Disaster Category breakdown.
 */
export interface ApiDisasterCategory {
  name: string;    // "Flood", "Fire", etc.
  count: number;   // raw incident count
}

/**
 * Matches TrendsDataDto.java in the backend.
 * Monthly data arrays for the line chart and bar chart.
 */
export interface ApiTrendsData {
  months: string[];      // ["Jan","Feb","Mar","Apr","May","Jun"]
  flood: number[];       // 6 monthly counts
  fire: number[];
  hurricane: number[];
  earthquake: number[];
  avgResponse: number[]; // 6 monthly average response times in minutes
}

/**
 * Matches VolunteerPerformanceDto.java in the backend.
 * One row in the Top Volunteer leaderboard.
 */
export interface ApiVolunteer {
  rank: number;
  name: string;
  avgResponseMinutes: number;  // raw integer — we format it in the component
  tasksCompleted: number;
  rating: number;
}

/**
 * Matches ReportsPageResponse.java in the backend.
 * The complete response object returned by GET /api/v1/reports?period=...
 */
export interface ApiReportsPageResponse {
  period: string;
  dashboardLabel: string;
  stats: ApiStatCard[];
  disasters: ApiDisasterCategory[];
  trends: ApiTrendsData;
  volunteers: ApiVolunteer[];
}

// ─────────────────────────────────────────────────────────────────────────────
// SERVICE
// ─────────────────────────────────────────────────────────────────────────────

@Injectable({
  providedIn: 'root'  // Makes this service available app-wide without importing in a module
})
export class ReportsService {

  /**
   * Base URL of your Spring Boot backend.
   * Make sure your Spring Boot app is running on port 8080.
   */
  private readonly baseUrl = 'http://localhost:8080/api/v1/reports';

  /**
   * Angular injects HttpClient automatically because we called
   * provideHttpClient(withFetch()) in app.config.ts — which you already have.
   */
  constructor(private http: HttpClient) {}

  /**
   * Calls GET /api/v1/reports?period=...
   *
   * @param period  one of: 'LAST_30_DAYS', 'Q2_2025', 'YTD_2025'
   * @returns       Observable<ApiReportsPageResponse>
   *
   * The component subscribes to this Observable. When the HTTP call completes,
   * Angular automatically delivers the parsed JSON object.
   */
  getReportsByPeriod(period: string): Observable<ApiReportsPageResponse> {
    const params = new HttpParams().set('period', period);
    return this.http.get<ApiReportsPageResponse>(this.baseUrl, { params });
  }

  /**
   * Calls GET /api/v1/reports/volunteers
   *
   * Returns just the top volunteers list (useful for isolated refresh).
   */
  getTopVolunteers(): Observable<ApiVolunteer[]> {
    return this.http.get<ApiVolunteer[]>(`${this.baseUrl}/volunteers`);
  }
}