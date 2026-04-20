import axios from "axios";

import { clearSession, getToken } from "../auth/session";

export const API_BASE_URL = "http://localhost:5006/api";
export const UPLOADS_BASE_URL = "http://localhost:5006/uploads";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API response error:", {
      message: error.message,
      code: error.code,
      url: error.config?.url,
      method: error.config?.method,
      request: error.request,
      response: error.response
    });

    if (!error.response) {
      error.message = `Network error. Please check your connection. (${error.code || "no_response"})`;
      return Promise.reject(error);
    }

    if (error.response?.status === 401) {
      clearSession();
    }

    error.message = error.response?.data?.message || `Request failed (${error.response.status})`;
    return Promise.reject(error);
  }
);

api.interceptors.request.use((config) => {
  const token = getToken();

  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default api;
