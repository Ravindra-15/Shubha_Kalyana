import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const API_BASE_URL = 'https://subhakalyan.delicod.com/api/v1';
// export const API_BASE_URL = 'http://localhost:5000/api/v1';
// export const API_BASE_URL = 'http://192.168.1.3:5000/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

apiClient.interceptors.request.use(async (config) => {
  const url = config.url || '';
  // onboarding endpoints use the onboarding token
  if (url.includes('/onboarding/')) {
    const onboardingToken = await AsyncStorage.getItem('onboardingToken');
    if (onboardingToken) {
      config.headers.Authorization = `Bearer ${onboardingToken}`;
    }
  } else {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  // Let axios auto-detect multipart boundary for FormData bodies.
  // Never force JSON content-type on file uploads.
  if (config.data instanceof FormData) {
    if (typeof config.headers?.delete === 'function') {
      config.headers.delete('Content-Type');
      config.headers.delete('content-type');
    } else {
      delete config.headers['Content-Type'];
      delete config.headers['content-type'];
    }

    // File uploads (photos, Aadhaar docs) need much more time than the
    // default 15s on real mobile networks -- a multi-MB multipart upload
    // over 4G routinely exceeds that, aborting the request client-side
    // with no server response at all. Only widen it for FormData bodies
    // so every other (JSON) request keeps its existing 15s timeout.
    config.timeout = 60000;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // No response at all means the request never reached the server
    // (backend down, no internet, timeout) -- distinct from a normal 4xx/5xx
    // reply that DID come back with its own message. Purely additive: every
    // existing field on the error (response, message, etc.) is untouched.
    error.isNetworkError = !error.response;
    return Promise.reject(error);
  },
);

export default apiClient;
