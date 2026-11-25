const API_BASE = '';

export function getToken(): string | null {
  return localStorage.getItem('aivshuman_token') || sessionStorage.getItem('aivshuman_token');
}

export function setToken(token: string, rememberMe = true) {
  if (rememberMe) {
    localStorage.setItem('aivshuman_token', token);
    sessionStorage.removeItem('aivshuman_token');
  } else {
    sessionStorage.setItem('aivshuman_token', token);
    localStorage.removeItem('aivshuman_token');
  }
}

export function clearToken() {
  localStorage.removeItem('aivshuman_token');
  sessionStorage.removeItem('aivshuman_token');
}

export async function apiRequest<T = any>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const err = await res.json();
      if (err?.detail) {
        message = typeof err.detail === 'string' ? err.detail : JSON.stringify(err.detail);
      }
    } catch {
      // ignore json parse failure
    }
    throw new Error(message);
  }
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return res.json();
  }
  return res as unknown as T;
}

export async function downloadProtectedFile(path: string, fallbackFilename: string) {
  const token = getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) {
    throw new Error(`Failed to download file (${res.status})`);
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fallbackFilename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
