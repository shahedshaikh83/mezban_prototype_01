import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { getApiBase } from './utils/api'

// 1. Auto-route relative /api calls to backend port 5000 if running on Live Server (port 5500, etc.)
if (typeof window !== 'undefined' && window.fetch) {
  const originalFetch = window.fetch;
  window.fetch = function(input, init) {
    if (typeof input === 'string' && input.startsWith('/api')) {
      const base = getApiBase();
      if (base) {
        input = `${base}${input}`;
      }
    } else if (input && typeof input === 'object' && input.url && input.url.startsWith('/api')) {
      const base = getApiBase();
      if (base) {
        input = new Request(`${base}${input.url}`, input);
      }
    }
    return originalFetch.call(this, input, init);
  };
}

// 2. Safe Response.prototype.json patch to prevent "Unexpected end of JSON input" fatal exceptions
if (typeof Response !== 'undefined' && Response.prototype && Response.prototype.json) {
  Response.prototype.json = async function() {
    try {
      const text = await this.text();
      if (!text || text.trim().length === 0) {
        return { success: false, error: 'Empty server response. Ensure backend server is running.' };
      }
      return JSON.parse(text);
    } catch (err) {
      console.warn('Failed to parse response as JSON:', err);
      return { success: false, error: 'Server returned non-JSON response.' };
    }
  };
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

