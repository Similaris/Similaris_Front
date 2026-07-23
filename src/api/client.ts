import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:8000/api",
});

const TOKEN_KEY = "similaris_token";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
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
}
