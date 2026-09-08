export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function unwrapApiData<T>(body: unknown): T | null {
  if (!isObject(body) || !('data' in body)) {
    return (body as T) ?? null;
  }
  return (body.data as T) ?? null;
}

export function unwrapDataList<T>(body: unknown): T[] {
  const data = unwrapApiData<unknown>(body);
  return Array.isArray(data) ? (data as T[]) : [];
}

export function envelopeStatus(body: unknown): number | undefined {
  if (!isObject(body) || typeof body.status !== 'number') {
    return undefined;
  }
  return body.status;
}

export function unwrapError(body: unknown): {
  errorCode?: string;
  message?: string;
} {
  const data = unwrapApiData<Record<string, unknown>>(body);
  if (!data) {
    return {};
  }
  return {
    errorCode: typeof data.errorCode === 'string' ? data.errorCode : undefined,
    message: typeof data.message === 'string' ? data.message : undefined,
  };
}

export function authLoginTokens(body: unknown): { accessToken: string | null } {
  const data = unwrapApiData<{ accessToken?: unknown }>(body);
  return {
    accessToken:
      typeof data?.accessToken === 'string' ? data.accessToken : null,
  };
}
