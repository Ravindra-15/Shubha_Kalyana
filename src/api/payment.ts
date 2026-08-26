import AsyncStorage from '@react-native-async-storage/async-storage';
import ReactNativeBlobUtil from 'react-native-blob-util';
import Share from 'react-native-share';
import apiClient, { API_BASE_URL } from './client';

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
  planId?: { _id: string; planName?: string } | null;
  targetProfileId?: { _id: string; basicInfo?: { firstName?: string; lastName?: string }; profileCode?: string } | null;
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

export const downloadAndShareReceipt = async (orderId: string) => {
  const token = await AsyncStorage.getItem('token');
  const filename = `receipt-${orderId.slice(-10)}.pdf`;
  const path = `${ReactNativeBlobUtil.fs.dirs.CacheDir}/${filename}`;

  const res = await ReactNativeBlobUtil.config({ fileCache: true, path }).fetch(
    'GET',
    `${API_BASE_URL}/payments/me/orders/${orderId}/receipt`,
    token ? { Authorization: `Bearer ${token}` } : undefined,
  );

  if (res.respInfo?.status && res.respInfo.status >= 400) {
    await ReactNativeBlobUtil.fs.unlink(path).catch(() => {});
    throw new Error('Could not download receipt');
  }

  const filePath = res.path();
  await Share.open({
    url: `file://${filePath}`,
    type: 'application/pdf',
    filename,
    failOnCancel: false,
  });
};
