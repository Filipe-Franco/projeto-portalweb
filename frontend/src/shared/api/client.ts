import { env } from '@/shared/config/env';

type QueryValue = string | number | boolean | null | undefined;

export type ApiResponse<T> = {
  data: T;
};

type ApiErrorBody = {
  error?: {
    message?: string;
    code?: string;
  };
};

export class ApiError extends Error {
  public readonly status: number;
  public readonly code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

function buildUrl(path: string, query?: Record<string, QueryValue>) {
  const url = new URL(`${env.apiBaseUrl}${path}`);

  Object.entries(query || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value));
    }
  });

  return url.toString();
}

async function parseResponse<T>(response: Response): Promise<T> {
  const body = (await response.json().catch(() => null)) as T | ApiErrorBody | null;

  if (!response.ok) {
    const errorBody = body as ApiErrorBody | null;
    throw new ApiError(
      errorBody?.error?.message || 'Não foi possível concluir a solicitação.',
      response.status,
      errorBody?.error?.code,
    );
  }

  return body as T;
}

export async function apiGet<T>(
  path: string,
  query?: Record<string, QueryValue>,
  init?: RequestInit,
) {
  const response = await fetch(buildUrl(path, query), {
    ...init,
    method: 'GET',
    headers: {
      Accept: 'application/json',
      ...init?.headers,
    },
  });

  return parseResponse<T>(response);
}

export async function apiPost<T>(path: string, body: unknown, init?: RequestInit) {
  const response = await fetch(buildUrl(path), {
    ...init,
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...init?.headers,
    },
    body: JSON.stringify(body),
  });

  return parseResponse<T>(response);
}

export async function apiPatch<T>(path: string, body?: unknown, init?: RequestInit) {
  const response = await fetch(buildUrl(path), {
    ...init,
    method: 'PATCH',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...init?.headers,
    },
    body: JSON.stringify(body || {}),
  });

  return parseResponse<T>(response);
}

export async function apiDelete<T>(path: string, init?: RequestInit) {
  const response = await fetch(buildUrl(path), {
    ...init,
    method: 'DELETE',
    headers: {
      Accept: 'application/json',
      ...init?.headers,
    },
  });

  return parseResponse<T>(response);
}
