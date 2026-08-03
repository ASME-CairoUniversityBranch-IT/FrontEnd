import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { DecodedToken, LoginRequest, LoginResponse } from '../models/auth.model';

const TOKEN_KEY = 'asme_auth_token';
const USER_KEY = 'asme_auth_user';

export interface AuthUser {
  userId: string;
  email: string;
  name: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private baseUrl = `${environment.apiUrl}/api/Auth`;

  /** Reactive flags/values components & guards can read without re-parsing storage each time. */
  readonly isAuthenticated = signal<boolean>(this.hasValidToken());
  readonly currentUser = signal<AuthUser | null>(this.hasValidToken() ? this.readStoredUser() : null);

  constructor(private http: HttpClient) {}

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.baseUrl}/login`, credentials).pipe(
      tap(res => this.storeSession(res)),
    );
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.isAuthenticated.set(false);
    this.currentUser.set(null);
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  private storeSession(res: LoginResponse): void {
    localStorage.setItem(TOKEN_KEY, res.token);
    localStorage.setItem(USER_KEY, JSON.stringify({ userId: res.userId, email: res.email, name: res.name }));
    this.isAuthenticated.set(this.hasValidToken());
    this.currentUser.set(this.readStoredUser());
  }

  private readStoredUser(): AuthUser | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AuthUser;
    } catch {
      return null;
    }
  }

  /** True only if a token exists AND it hasn't expired yet. */
  hasValidToken(): boolean {
    const token = this.getToken();
    if (!token) return false;

    const decoded = this.decodeToken(token);
    if (!decoded?.exp) return false;

    const isExpired = decoded.exp * 1000 <= Date.now();
    if (isExpired) {
      // Clean up silently so stale tokens don't linger in storage.
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      return false;
    }
    return true;
  }

  private decodeToken(token: string): DecodedToken | null {
    try {
      const payload = token.split('.')[1];
      const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
      return JSON.parse(json);
    } catch {
      return null;
    }
  }
}
