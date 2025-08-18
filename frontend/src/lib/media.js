// frontend/src/lib/media.js
export function mediaUrl(path) {
    // Always give a sane default that the backend actually serves:
    if (!path) path = '/uploads/placeholder.jpg';
  
    // Pass through absolute/external and blob/data URLs
    if (
      path.startsWith('http://') ||
      path.startsWith('https://') ||
      path.startsWith('data:') ||
      path.startsWith('blob:')
    ) {
      return path;
    }
  
    const API_ORIGIN = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, '');
  
    // Backend serves static files at /uploads (not /api/uploads)
    if (path.startsWith('/uploads')) {
      return `${API_ORIGIN}${path}`;
    }
  
    // If someone saved a bare filename, try to serve from /uploads
    if (!path.startsWith('/')) {
      return `${API_ORIGIN}/uploads/${path}`;
    }
  
    // Fallback
    return `${API_ORIGIN}${path}`;
  }