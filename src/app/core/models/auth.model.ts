export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  email: string;
  displayName: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  displayName: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface CurrentUser {
  email: string;
  displayName: string;
}
