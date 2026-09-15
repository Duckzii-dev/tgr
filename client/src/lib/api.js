const BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

async function req(path, { method = 'GET', body, headers = {}, ...rest } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...headers },
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