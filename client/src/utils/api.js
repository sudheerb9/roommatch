// Client utility helpers used by api workflows.
const DEFAULT_API_BASE_URL = 'http://localhost:3001';

export function getApiBaseUrl() {
  // Prefer explicit env override, fall back to local dev API.
  return (
    process.env.REACT_APP_API_BASE_URL ||
    process.env.REACT_APP_API_BASE_URL?.trim() ||
    DEFAULT_API_BASE_URL
  );
}

export function getBearerToken() {
  const fromEnv = process.env.REACT_APP_DEV_BEARER_TOKEN;
  if (fromEnv && String(fromEnv).trim()) {
    return String(fromEnv).trim();
  }

  try {
    // LocalStorage access can throw in non-browser contexts/tests.
    const raw = localStorage.getItem('roommatch_bearer_token');
    return raw ? String(raw).trim() : '';
  } catch {
    return '';
  }
}

export function setBearerToken(token) {
  const normalized = token ? String(token).trim() : '';
  try {
    if (!normalized) {
      localStorage.removeItem('roommatch_bearer_token');
    } else {
      localStorage.setItem('roommatch_bearer_token', normalized);
    }
  } catch {
    // ignore storage errors
  }
  return normalized;
}

async function readJsonResponse(res) {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export async function apiFetch(path, { method = 'GET', body, token } = {}) {
  const base = getApiBaseUrl().replace(/\/+$/, '');
  const url = `${base}${path.startsWith('/') ? '' : '/'}${path}`;

  const headers = { Accept: 'application/json' };
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  // Per-request token override is useful for auth bootstrap/login flows.
  const bearer = token !== undefined ? token : getBearerToken();
  if (bearer) {
    headers.Authorization = `Bearer ${bearer}`;
  }

  const res = await fetch(url, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const payload = await readJsonResponse(res);

  if (!res.ok) {
    const message =
      payload && typeof payload === 'object' && payload.error
        ? payload.error
        : `Request failed (${res.status})`;
    // Enrich thrown errors so pages can branch on status and payload details.
    const err = new Error(message);
    err.status = res.status;
    err.payload = payload;
    throw err;
  }

  return payload;
}
