import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'https://subhakalyan.delicod.com/api/v1';

// const BASE_URL = 'http://localhost:5000/api/v1';

const apiClient = axios.create({
  baseURL: BASE_URL,
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

 // Let axios auto-detect multipart boundary for FormData bodies —
  // never force JSON content-type on file uploads.
  if (config.data instanceof FormData) {
    if (typeof config.headers?.delete === 'function') {
      config.headers.delete('Content-Type');
      config.headers.delete('content-type');
    } else {
      delete config.headers['Content-Type'];
      delete config.headers['content-type'];
    }
  }

  return config;
});

export default apiClient;