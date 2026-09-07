import apiClient from './client';

// get access status for a specific profile (isMembershipProfileUnlocked, bothHaveActivePlans, etc.)
export const getProfileAccess = async (profileId: string) => {
  try {
    const res = await apiClient.get(`/membership/access/profiles/${profileId}`);
    return res.data?.data || null;
  } catch {
    return null;
  }
};

// spend one membership credit to unlock this profile's contact details
export const unlockProfileWithMembership = async (profileId: string) => {
  const res = await apiClient.post(`/membership/access/profiles/${profileId}/unlock-membership`);
  return res.data?.data;
};

// verify payment after Razorpay success
export const verifyPayment = async (payload: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}) => {
  const res = await apiClient.post('/membership/payments/verify', payload);
  return res.data?.data;
};

export const recordPaymentFailure = async (payload: {
  gatewayOrderId: string;
  gatewayPaymentId: string;
  error?: unknown;
}) => {
  const res = await apiClient.post('/membership/payments/failure', payload);
  return res.data?.data;
};

// active membership + access summary
export const getAccessSummary = async () => {
  try {
    const res = await apiClient.get('/membership/me/access');
    return res.data?.data || null;
  } catch {
    return null;
  }
};
export const revealContact = async (profileId: string) => {
  try {
    const res = await apiClient.post(`/membership/access/profiles/${profileId}/contact/reveal`);
    return res.data?.data?.contact || null;
  } catch {
    return null;
  }
};
