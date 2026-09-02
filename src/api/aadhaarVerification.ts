import apiClient from './client';

export const verifyAadhaarWithMobile = async ({
  aadhaarNumber,
  mobileNumber,
}: {
  aadhaarNumber: string;
  mobileNumber: string;
}) => {
  const res = await apiClient.post('/aadhaar-verification/validate', {
    aadhaarNumber,
    mobileNumber,
  });

  return res.data?.data || null;
};

export const requestAadhaarOtp = async (aadhaarNumber: string) => {
  const res = await apiClient.post('/aadhaar-verification/otp/request', {
    aadhaarNumber,
    consent: true,
  });

  return res.data?.data || null;
};

export const confirmAadhaarOtp = async (otp: string) => {
  const res = await apiClient.post('/aadhaar-verification/otp/confirm', { otp });

  return res.data?.data || null;
};

export const getAadhaarVerificationStatus = async () => {
  const res = await apiClient.get('/aadhaar-verification/status');

  return res.data?.data || null;
};
