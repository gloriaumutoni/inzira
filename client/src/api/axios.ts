import axios from "axios";
import {
  getAccessToken,
  setAccessToken,
  clearAccessToken,
} from "../utils/token";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL as string,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const PUBLIC_PATHS = new Set(["/", "/login", "/signup"]);

// Singleton so concurrent 401s share one refresh request
let refreshPromise: Promise<string> | null = null;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    // Let the refresh endpoint's own 401 propagate
    if (original.url?.includes("/auth/refresh")) {
      throw error;
    }

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;

      refreshPromise ??= axios
        .post(
          `${import.meta.env.VITE_API_URL as string}/auth/refresh`,
          {},
          { withCredentials: true },
        )
        .then(({ data }) => {
          const token = data.data.accessToken as string;
          setAccessToken(token);
          return token;
        })
        .catch((err) => {
          clearAccessToken();
          if (!PUBLIC_PATHS.has(globalThis.location.pathname)) {
            globalThis.location.href = "/login";
          }
          throw err;
        })
        .finally(() => {
          refreshPromise = null;
        });

      const token = await refreshPromise;
      original.headers.Authorization = `Bearer ${token}`;
      return api(original);
    }

    throw error;
  },
);
