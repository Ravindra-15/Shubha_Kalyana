import apiClient from './client';

// Separate, parallel Hypersign Aadhaar test flow -- does not touch the
// existing Surepass-based Aadhaar verification endpoints in aadhaarVerification.ts.
export const requestHypersignAadhaarOtp = async (aadhaarNumber: string) => {
  const res = await apiClient.post('/aadhaar-verification/hypersign/otp/request', {
    aadhaarNumber,
  });
  return res.data?.data || null;
};

export const confirmHypersignAadhaarOtp = async (otp: string) => {
  const res = await apiClient.post('/aadhaar-verification/hypersign/otp/confirm', { otp });
  return res.data?.data || null;
};

export const getHypersignAadhaarStatus = async () => {
  const res = await apiClient.get('/aadhaar-verification/hypersign/status');
  return res.data?.data || null;
};
