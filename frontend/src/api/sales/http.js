/**
 * Base HTTP helper for SunPower Sales API
 * Conforms to the hackathon rule: Every response uses { success, data, message }
 */

const BASE_URL = (typeof process !== 'undefined' && process.env?.REACT_APP_API_URL) ||
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) ||
  '/api';

export const isGlobalMockEnabled = () => {
  if (typeof window !== 'undefined') {
    const val = localStorage.getItem('SUNPOWER_SALES_USE_MOCK');
    if (val !== null) {
      return val === 'true';
    }
  }
  // Default to mock true until real backend endpoints are ready
  return true;
};

export const setGlobalMockEnabled = (enabled) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('SUNPOWER_SALES_USE_MOCK', enabled ? 'true' : 'false');
    window.dispatchEvent(new Event('sales_mock_toggle'));
  }
};

export async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  if (config.body && typeof config.body === 'object' && !(config.body instanceof FormData)) {
    config.body = JSON.stringify(config.body);
  }

  try {
    const response = await fetch(url, config);
    const result = await response.json().catch(() => null);

    if (!response.ok) {
      return {
        success: false,
        data: null,
        message: result?.message || `HTTP ${response.status}: ${response.statusText}`,
        errors: result?.errors || null,
      };
    }

    if (result && typeof result.success !== 'undefined') {
      return result;
    }

    return {
      success: true,
      data: result,
      message: 'Request successful',
    };
  } catch (error) {
    return {
      success: false,
      data: null,
      message: error.message || 'Network request failed',
      errors: [error.message],
    };
  }
}

export default {
  get: (endpoint, options) => request(endpoint, { method: 'GET', ...options }),
  post: (endpoint, body, options) => request(endpoint, { method: 'POST', body, ...options }),
  put: (endpoint, body, options) => request(endpoint, { method: 'PUT', body, ...options }),
  patch: (endpoint, body, options) => request(endpoint, { method: 'PATCH', body, ...options }),
  delete: (endpoint, options) => request(endpoint, { method: 'DELETE', ...options }),
  isGlobalMockEnabled,
  setGlobalMockEnabled,
};
