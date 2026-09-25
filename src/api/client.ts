import axios, { isAxiosError, type InternalAxiosRequestConfig } from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000/api";
export const api = axios.create({
  baseURL: API_BASE_URL,
});

const TOKEN_KEY = "similaris_token";
const REFRESH_TOKEN_KEY = "similaris_refresh_token";

interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

interface ApiErrorPayload {
  detail?: string | { message?: string };
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

function setRefreshToken(token: string | null) {
  if (token) localStorage.setItem(REFRESH_TOKEN_KEY, token);
  else localStorage.removeItem(REFRESH_TOKEN_KEY);
}

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let refreshRequest: Promise<TokenResponse> | null = null;

api.interceptors.response.use(undefined, async (error) => {
  const request = error.config as RetryableRequestConfig | undefined;
  const refreshToken = getRefreshToken();
  const isAuthRequest = request?.url?.includes("/auth/");

  if (
    error.response?.status !== 401 ||
    !request ||
    request._retry ||
    isAuthRequest ||
    !refreshToken
  ) {
    return Promise.reject(error);
  }

  request._retry = true;
  try {
    refreshRequest ??= axios
      .post<TokenResponse>(`${API_BASE_URL}/auth/refresh`, {
        refresh_token: refreshToken,
      })
      .then((response) => response.data);

    const tokens = await refreshRequest;
    setToken(tokens.access_token);
    setRefreshToken(tokens.refresh_token);
    request.headers.Authorization = `Bearer ${tokens.access_token}`;
    return api(request);
  } catch (refreshError) {
    logout();
    window.dispatchEvent(new Event("similaris:session-expired"));
    return Promise.reject(refreshError);
  } finally {
    refreshRequest = null;
  }
});

export interface HealthResponse {
  status: string;
  app: string;
  version: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
}

export async function getHealth(): Promise<HealthResponse> {
  const { data } = await api.get<HealthResponse>("/health");
  return data;
}

export async function login(email: string, password: string): Promise<User> {
  const { data } = await api.post<TokenResponse>("/auth/login", {
    email,
    password,
  });
  setToken(data.access_token);
  setRefreshToken(data.refresh_token);
  return data.user;
}

export async function register(
  name: string,
  email: string,
  password: string,
): Promise<User> {
  const { data } = await api.post<User>("/auth/register", {
    name,
    email,
    password,
  });
  return data;
}

export async function me(): Promise<User> {
  const { data } = await api.get<User>("/auth/me");
  return data;
}

export function logout() {
  setToken(null);
  setRefreshToken(null);
}

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (!isAxiosError<ApiErrorPayload>(error)) return fallback;
  if (!error.response) return "Não foi possível conectar ao servidor.";

  const detail = error.response.data?.detail;
  if (typeof detail === "string" && detail.trim()) return detail;
  if (detail && typeof detail === "object" && typeof detail.message === "string") {
    return detail.message;
  }
  return fallback;
}
