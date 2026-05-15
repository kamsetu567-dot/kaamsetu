const BASE = process.env.NEXT_PUBLIC_APP_URL || '';

function getAuthHeaders() {
  if (typeof window === 'undefined') return {};
  const token =
    localStorage.getItem('kaamsetu_admin_token') ||
    localStorage.getItem('kaamsetu_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function apiFetch(path, options = {}) {
  const { method = 'GET', body, timeout = 30000 } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const res = await fetch(`${BASE}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    let data;
    try {
      data = await res.json();
    } catch {
      data = { success: false, message: `Server error (${res.status})` };
    }

    if (!res.ok) {
      const err = new Error(data.message || `Request failed (${res.status})`);
      err.status = res.status;
      err.response = data;
      throw err;
    }

    return data;
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error('Request timed out. Please try again.');
    }
    throw err;
  }
}

export function apiGet(path, params = {}) {
  const query = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== '' && v !== null)
  ).toString();
  return apiFetch(query ? `${path}?${query}` : path, { method: 'GET' });
}

export function apiPost(path, body) {
  return apiFetch(path, { method: 'POST', body });
}

export function apiPatch(path, body) {
  return apiFetch(path, { method: 'PATCH', body });
}

export function apiDelete(path) {
  return apiFetch(path, { method: 'DELETE' });
}

export async function callAPI(endpoint, options = {}) {
  try {
    const token = typeof window !== 'undefined'
      ? (localStorage.getItem('kaamsetu_token') || localStorage.getItem('kaamsetu_admin_token'))
      : null;

    const res = await fetch(endpoint, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      },
    });

    const data = await res.json();

    if (res.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('kaamsetu_token');
        localStorage.removeItem('kaamsetu_user');
        window.location.href = '/auth/login';
      }
      return null;
    }

    if (!res.ok) {
      throw new Error(data.message || `Request failed (${res.status})`);
    }

    return data;
  } catch (err) {
    if (err.message?.includes('fetch')) {
      throw new Error('इंटरनेट कनेक्शन चेक करें / Check your internet connection');
    }
    throw err;
  }
}
