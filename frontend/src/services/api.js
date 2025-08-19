// frontend/src/services/api.js
import { toast } from 'sonner';

export const API_BASE_URL =
  `${(import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, '')}/api`;

export const authFetch = async (endpoint, options = {}, showToast = false) => {
  const token = localStorage.getItem('token');

  const isFormData = options.body instanceof FormData;
  const headers = {
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(!isFormData ? { 'Content-Type': 'application/json' } : {}),
  };

  try {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const contentType = res.headers.get('content-type') || '';
    const contentLengthHeader = res.headers.get('content-length');
    const contentLength = contentLengthHeader == null ? null : Number(contentLengthHeader);
    const hasBody = res.status !== 204 && (contentLength === null || contentLength > 0);

    let data = null;
    if (hasBody && contentType.includes('application/json')) {
      data = await res.json().catch(() => null);
    }

    if (!res.ok) {
      if (showToast) toast.error(data?.error || `HTTP ${res.status}`);
      throw new Error(data?.error || `Request failed (${res.status})`);
    }

    if (showToast && data?.message) toast.success(data.message);
    return data ?? (hasBody ? {} : null);
  } catch (err) {
    if (showToast) toast.error(err.message || 'Request failed');
    throw err;
  }
};