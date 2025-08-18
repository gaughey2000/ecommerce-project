const API = import.meta.env.VITE_API_URL?.replace(/\/+$/, '') || 'http://localhost:3000';

export function buildImageUrl(path, fallback = '/placeholder.jpg') {
  if (!path) return fallback;
  if (/^https?:\/\//i.test(path) || /^\/\//.test(path)) return path;
  if (path.startsWith('/uploads/')) return `${API}${path}`;

  if (!path.startsWith('/')) return `${API}/uploads/${path}`;
  return path; 
}