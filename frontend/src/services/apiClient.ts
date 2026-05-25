/**
 * Centralized axios client.
 *
 * - Reads the base URL from the validated config.
 * - Attaches a per-request id (for log correlation with the backend).
 * - Normalizes errors into a consistent `ApiError` shape so callers
 *   don't have to inspect axios internals.
 * - Reports failures to Sentry (if enabled).
 */

import axios, { AxiosError, type AxiosInstance } from 'axios';
import { config } from '../config';
import { Sentry } from '../config/sentry';

export interface ApiErrorPayload {
  code: string;
  message: string;
  details?: unknown;
  requestId?: string;
}

export class ApiError extends Error {
  public readonly status: number;
  public readonly code: string;
  public readonly details?: unknown;
  public readonly requestId?: string;

  constructor(payload: ApiErrorPayload, status: number) {
    super(payload.message);
    this.name = 'ApiError';
    this.status = status;
    this.code = payload.code;
    this.details = payload.details;
    this.requestId = payload.requestId;
  }
}

function newRequestId(): string {
  // crypto.randomUUID is available in all modern browsers and JSDOM 22+.
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `req-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export const apiClient: AxiosInstance = axios.create({
  baseURL: config.api.baseUrl,
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((req) => {
  req.headers.set('x-request-id', newRequestId());
  return req;
});

apiClient.interceptors.response.use(
  (res) => res,
  (error: AxiosError<{ error?: ApiErrorPayload }>) => {
    // Network / no-response failures
    if (!error.response) {
      const apiErr = new ApiError(
        {
          code: 'NETWORK_ERROR',
          message: error.message || 'Network error',
        },
        0,
      );
      Sentry.captureException(apiErr);
      return Promise.reject(apiErr);
    }

    const payload =
      error.response.data?.error ?? {
        code: 'UNKNOWN_ERROR',
        message: error.message || 'Unknown error',
      };

    const apiErr = new ApiError(payload, error.response.status);

    // Report 5xx — 4xx are usually user/validation issues, not bugs.
    if (apiErr.status >= 500) {
      Sentry.captureException(apiErr);
    }

    return Promise.reject(apiErr);
  },
);
