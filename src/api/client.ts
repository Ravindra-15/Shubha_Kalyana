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
  return config;
});

export default apiClient;