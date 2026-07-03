import apiClient from './client';

// get the ₹99 unlock price
export const getUnlockPrice = async () => {
  try {
    const res = await apiClient.get('/membership/profile-unlocks/price');
    return res.data?.data || { amount: 99, currency: 'INR' };
  } catch {
    return { amount: 99, currency: 'INR' };
  }
};

// get access status for a specific profile (isProfileSingleUnlocked, canViewProfile, etc.)
export const getProfileAccess = async (profileId: string) => {
  try {
    const res = await apiClient.get(`/membership/access/profiles/${profileId}`);
    return res.data?.data || null;
  } catch {
    return null;
  }
};

// create the profile-unlock payment order
export const createProfileUnlockOrder = async (targetProfileId: string) => {
  const res = await apiClient.post('/membership/orders/profile-unlock', { targetProfileId });
  return res.data?.data; // { order: { gatewayOrderId, amount, currency }, gateway, keyId }
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