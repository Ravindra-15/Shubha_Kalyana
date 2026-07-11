import apiClient from './client';

export const getAccountSettings = async () => {
  const res = await apiClient.get('/settings/account');
  return res.data?.data?.user;
};

export const updateEmail = async (email: string) => {
  const res = await apiClient.post('/settings/update-email', { email });
  return res.data?.data;
};

export const sendEmailOtp = async (email: string) => {
  const res = await apiClient.post('/settings/send-email-otp', { email });
  return res.data?.data;
};

export const verifyEmailOtp = async (code: string) => {
  const res = await apiClient.post('/settings/verify-email-otp', { code });
  return res.data?.data; // { email, isEmailVerified }
};

export const sendMobileOtp = async () => {
  const res = await apiClient.post('/settings/send-mobile-otp');
  return res.data?.data;
};

export const verifyMobileOtp = async (code: string) => {
  const res = await apiClient.post('/settings/verify-mobile-otp', { code });
  return res.data?.data;
};

export const sendChangeMobileOtp = async (newMobile: string) => {
  const res = await apiClient.post('/settings/send-change-mobile-otp', { newMobile });
  return res.data?.data;
};

export const verifyChangeMobileOtp = async (code: string) => {
  const res = await apiClient.post('/settings/verify-change-mobile-otp', { code });
  return res.data?.data; // { mobile, accessToken }
};

export const changeMpin = async (currentMpin: string, newMpin: string, confirmMpin: string) => {
  const res = await apiClient.post('/settings/change-mpin', { currentMpin, newMpin, confirmMpin });
  return res.data?.data;
};

export const requestDeleteAccount = async (reasons: string[]) => {
  const res = await apiClient.post('/settings/delete-account-request', { reasons });
  return res.data?.data;
};

export const saveLanguagePreference = async (language: string) => {
  const res = await apiClient.post('/settings/language', { language });
  return res.data?.data;
};

// TODO: backend logic pending — endpoint responds but doesn't do anything with the submission yet
export const submitSupportRequest = async (payload: { subject?: string; message: string }) => {
  const res = await apiClient.post('/settings/support', payload);
  return res.data?.data;
};

export const getMyComplaints = async () => {
  const res = await apiClient.get('/settings/complaints');
  return res.data?.data?.complaints || [];
};

// Change MPIN reuses the existing forgot-mpin OTP flow (real, functional)
export const sendChangeMpinOtp = async (mobile: string) => {
  const res = await apiClient.post('/auth/forgot-mpin/send-otp', { mobile });
  return res.data?.data;
};

export const resetMpin = async (payload: {
  mobile: string;
  code: string;
  mpin: string;
  confirmMpin: string;
}) => {
  const res = await apiClient.post('/auth/forgot-mpin/reset', payload);
  return res.data?.data;
};