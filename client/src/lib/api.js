const BASE = import.meta.env.VITE_API_URL || '/api';

function getCsrfToken() {
  const match = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

const SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS'];

async function req(path, { method = 'GET', body, headers = {}, ...rest } = {}) {
  const csrf = getCsrfToken();
  const finalHeaders = { 'Content-Type': 'application/json', ...headers };
  if (csrf && !SAFE_METHODS.includes(method.toUpperCase())) {
    finalHeaders['X-CSRF-Token'] = csrf;
  }

  const res = await fetch(`${BASE}${path}`, {
    method,
    credentials: 'include',
    headers: finalHeaders,
    body: body ? JSON.stringify(body) : undefined,
    ...rest,
  });
  const isJson = res.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await res.json() : null;
  if (!res.ok) throw new Error(data?.error || `Request failed (${res.status})`);
  return data;
}

export const api = {
  get: (p, opts) => req(p, opts),
  post: (p, body, opts) => req(p, { ...opts, method: 'POST', body }),
  put: (p, body, opts) => req(p, { ...opts, method: 'PUT', body }),
  del: (p, opts) => req(p, { ...opts, method: 'DELETE' }),
  BASE,
};