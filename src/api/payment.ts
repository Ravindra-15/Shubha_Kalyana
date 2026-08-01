import apiClient from './client';

const USER_PAYMENT_STATUSES = new Set(['PAID', 'FAILED']);

export type PaymentOrder = {
  _id: string;
  purpose: string;
  amount: number;
  currency: string;
  gateway: string;
  gatewayOrderId: string;
  status: 'PAID' | 'FAILED';
  createdAt: string;
  fulfilledAt?: string;
  fulfillmentError?: string;
};

export const getMyPaymentOrders = async (page = 1, limit = 20) => {
  const res = await apiClient.get('/payments/me/orders', {
    params: { page, limit, status: 'PAID,FAILED' },
  });
  const data = (res.data?.data || { items: [], pagination: null }) as {
    items: PaymentOrder[];
    pagination: any;
  };

  return {
    ...data,
    items: (data.items || []).filter((item) => USER_PAYMENT_STATUSES.has(item.status)),
  };
};
