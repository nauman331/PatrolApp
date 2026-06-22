type ApiErrorOptions = {
  statusCode?: number;
  fallback?: string;
};

function collectValidationMessages(errors: unknown): string[] {
  if (!errors || typeof errors !== 'object' || Array.isArray(errors)) {
    return [];
  }

  const messages: string[] = [];
  for (const value of Object.values(errors as Record<string, unknown>)) {
    if (typeof value === 'string' && value.trim()) {
      messages.push(value.trim());
      continue;
    }
    if (Array.isArray(value)) {
      for (const item of value) {
        if (typeof item === 'string' && item.trim()) {
          messages.push(item.trim());
        }
      }
    }
  }
  return messages;
}

function readMessageField(payload: Record<string, unknown>): string | undefined {
  const candidates = [payload.msg, payload.message, payload.error];
  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate.trim();
    }
  }

  if (payload.error && typeof payload.error === 'object' && !Array.isArray(payload.error)) {
    const nested = payload.error as Record<string, unknown>;
    if (typeof nested.message === 'string' && nested.message.trim()) {
      return nested.message.trim();
    }
  }

  return undefined;
}

function statusFallback(statusCode?: number, fallback = 'Something went wrong. Please try again.'): string {
  switch (statusCode) {
    case 400:
      return 'Invalid request. Please review your details and try again.';
    case 401:
      return 'Invalid email or password. Please check your credentials and try again.';
    case 403:
      return 'Your account is not authorized to sign in.';
    case 404:
      return 'The requested service is unavailable. Please try again later.';
    case 422:
      return 'Please correct the highlighted details and try again.';
    case 429:
      return 'Too many attempts. Please wait a moment and try again.';
    case 500:
    case 502:
    case 503:
      return 'Our servers are temporarily unavailable. Please try again shortly.';
    default:
      return fallback;
  }
}

export function extractApiErrorMessage(
  payload: unknown,
  fallback = 'Something went wrong. Please try again.',
  options: ApiErrorOptions = {},
): string {
  if (typeof payload === 'string' && payload.trim()) {
    return payload.trim();
  }

  if (payload && typeof payload === 'object') {
    const obj = payload as Record<string, unknown>;
    const validationMessages = collectValidationMessages(obj.errors);
    if (validationMessages.length > 0) {
      return validationMessages[0];
    }

    const directMessage = readMessageField(obj);
    if (directMessage) {
      return directMessage;
    }
  }

  return statusFallback(options.statusCode, options.fallback ?? fallback);
}

export function getRequestErrorMessage(
  error: unknown,
  fallback = 'Something went wrong. Please try again.',
  requestUrl?: string,
): string {
  if (error && typeof error === 'object') {
    const err = error as {
      message?: string;
      code?: string;
      response?: { status?: number; data?: unknown };
    };

    if (err.message === 'Network Error' || !err.response) {
      const target = requestUrl ? ` (${requestUrl})` : '';
      if (requestUrl?.includes('127.0.0.1') || requestUrl?.includes('localhost')) {
        return `Cannot reach local server${target}. On a phone use DEV_MACHINE_IP in .env (your PC LAN IP) and run: php artisan serve --host=0.0.0.0 --port=8000`;
      }
      return `Unable to connect to the server${target}. Check API_BASE_URL in .env, phone internet/Wi‑Fi, then restart Metro with --reset-cache.`;
    }

    return extractApiErrorMessage(err.response?.data, fallback, {
      statusCode: err.response?.status,
      fallback,
    });
  }

  return fallback;
}
