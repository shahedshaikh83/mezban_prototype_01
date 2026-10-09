/**
 * Smart API client for MEZBAAN application
 * Handles Live Server ports (5500, 5501, 8080, etc.), Vite dev proxy (3000), 
 * Express direct serving (5000), and provides safe JSON parsing with zero unhandled crashes.
 */

export const getApiBase = () => {
  if (typeof window === 'undefined') return '';
  const port = window.location.port;
  // If running via Live Server (port 5500, 5501, 8080, 5555, etc.) or file: protocol,
  // target the backend Express server running on port 5000
  if (port && port !== '3000' && port !== '5000') {
    return 'http://localhost:5000';
  }
  if (window.location.protocol === 'file:') {
    return 'http://localhost:5000';
  }
  return '';
};

export const getApiUrl = (endpoint) => {
  if (!endpoint) return '';
  if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
    return endpoint;
  }
  const base = getApiBase();
  return `${base}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
};

/**
 * Resilient fetch that never crashes on empty responses, non-JSON 404/500 pages,
 * or connection drops.
 */
export const apiFetch = async (endpoint, options = {}) => {
  const url = getApiUrl(endpoint);
  try {
    const res = await fetch(url, options);
    const contentType = res.headers.get('content-type') || '';
    
    let data = null;
    let rawText = '';
    
    try {
      rawText = await res.text();
      if (rawText && rawText.trim().length > 0) {
        data = JSON.parse(rawText);
      }
    } catch {
      // Failed to parse JSON (e.g. empty string or HTML error page from proxy/Live Server)
      data = null;
    }

    if (!res.ok) {
      const errorMessage = data?.message || data?.error || `Server responded with status ${res.status}`;
      return {
        ok: false,
        status: res.status,
        data,
        error: errorMessage,
        rawText
      };
    }

    return {
      ok: true,
      status: res.status,
      data: data || {},
      rawText
    };
  } catch (err) {
    return {
      ok: false,
      status: 0,
      data: null,
      error: err.message || 'Network connection error. Ensure backend server is running.',
      isNetworkError: true
    };
  }
};
