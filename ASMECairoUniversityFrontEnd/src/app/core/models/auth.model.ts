export interface LoginRequest {
  email: string;
  password: string;
}

/** Shape returned by the API's /api/Auth/login endpoint. */
export interface LoginResponse {
  token: string;
  expiresAt: string;
  userId: string;
  email: string;
  name: string;
}

/** Claims encoded in the JWT payload itself. */
export interface DecodedToken {
  sub?: string;
  email?: string;
  name?: string;
  superAdmin?: string;
  exp: number;
  iss?: string;
  aud?: string;
  [key: string]: unknown;
}
