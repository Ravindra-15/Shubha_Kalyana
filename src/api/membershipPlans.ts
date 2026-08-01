import apiClient from './client';

export type PlanBenefits = {
  chatOptions?: boolean;
  sendUnlimitedMessages?: boolean;
  customerSupport?: boolean;
  matchesCanConnectDirectly?: boolean;
  verifiedBadge?: boolean;
};

export type UpgradePricing = {
  isUpgrade: boolean;
  currentMembershipId?: string;
  currentPlanName?: string;
  currentPlanPrice: number;
  targetPlanPrice: number;
  creditAmount: number;
  payableAmount: number;
  remainingDays: number;
  totalDays: number;
};

export type Plan = {
  _id: string;
  planName: string;
  price: number;
  currency?: string;
  duration?: { value: number; unit: string };
  label?: string;
  accessLimit?: number;
  rank?: number;
  displayOrder?: number;
  benefits?: PlanBenefits;
  upgradePricing?: UpgradePricing;
  
};

// list active plans (sorted by rank)
export const getPlans = async (): Promise<Plan[]> => {
  try {
    const res = await apiClient.get('/membership/plans');
    const plans = res.data?.data?.plans || res.data?.data || [];
    return Array.isArray(plans) ? plans : [];
  } catch {
    return [];
  }
};

// create membership order → returns { order, keyId, gateway }
export const createMembershipOrder = async (planId: string) => {
  const res = await apiClient.post('/membership/orders/membership', { planId });
  return res.data?.data;
};

// active membership
export const getActiveMembership = async () => {
  try {
    const res = await apiClient.get('/membership/me/active');
    return res.data?.data || null;
  } catch {
    return null;
  }
};
