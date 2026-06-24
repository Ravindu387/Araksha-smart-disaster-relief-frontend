import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs';

export interface CurrentUser {
  id: number;
  name: string;
  email: string;
  role: string;
  department: string;
  initials: string;
}

export interface UpdateUserPayload {
  name: string;
  email: string;
  department: string;
}

/**
 * Talks to the Spring Boot backend. There's no login flow yet, so this
 * always fetches whichever user the backend considers "current"
 * (GET /api/users/me) — see UserService on the backend.
 *
 * providedIn: 'root' makes this a singleton, so the HTTP call below fires
 * once no matter how many components inject this service.
 */
@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly http = inject(HttpClient);

  /** Change this if your backend runs somewhere other than localhost:8080. */
  private readonly apiBase = 'http://localhost:8080';

  readonly currentUser = signal<CurrentUser | null>(null);
  readonly loadError = signal<string | null>(null);

  constructor() {
    this.http.get<CurrentUser>(`${this.apiBase}/api/users/me`).subscribe({
      next: (user) => this.currentUser.set(user),
      error: (err) => {
        console.error('Failed to load current user from backend:', err);
        this.loadError.set('Could not reach the backend.');
      },
    });
  }

  /**
   * Persists profile edits from the Settings page. On success, updates the
   * shared signal too, so the header/sidebar refresh immediately without a
   * page reload.
   */
  updateCurrentUser(payload: UpdateUserPayload) {
    return this.http
      .put<CurrentUser>(`${this.apiBase}/api/users/me`, payload)
      .pipe(tap((updated) => this.currentUser.set(updated)));
  }
}
