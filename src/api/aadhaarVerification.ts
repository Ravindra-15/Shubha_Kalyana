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
