import apiClient from './client';

export type PaymentOrder = {
  _id: string;
  purpose: string;
  amount: number;
  currency: string;
  gateway: string;
  gatewayOrderId: string;
  status: 'CREATED' | 'PAID' | 'FAILED' | 'FULFILLMENT_FAILED' | 'REFUND_PENDING' | 'REFUNDED' | 'EXPIRED';
  createdAt: string;
  fulfilledAt?: string;
  fulfillmentError?: string;
};

export const getMyPaymentOrders = async (page = 1, limit = 20) => {
  const res = await apiClient.get('/payments/me/orders', { params: { page, limit } });
  return res.data?.data as { items: PaymentOrder[]; pagination: any };
};