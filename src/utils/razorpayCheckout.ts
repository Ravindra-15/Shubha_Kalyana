import RazorpayCheckout from 'react-native-razorpay';
import {
  createProfileUnlockOrder,
  recordPaymentFailure,
  verifyPayment,
} from '../api/membershipPayment';
import { createMembershipOrder } from '../api/membershipPlans';
import type { PaymentOrderResult } from './paymentBreakup';

type PaymentResult = { success: boolean; message?: string };
type UserInfo = { name?: string; email?: string; contact?: string };

const paymentErrorMessage = (err: any, fallback: string) =>
  err?.description || err?.response?.data?.message || err?.message || fallback;

const failureMetadata = (err: any) =>
  err?.error?.metadata || err?.metadata || err?.details?.metadata || {};

const serializeFailure = (err: any) => {
  const error = err?.error || err;
  return {
    code: error?.code,
    description: error?.description || error?.message,
    source: error?.source,
    step: error?.step,
    reason: error?.reason,
    metadata: failureMetadata(err),
  };
};

const recordCheckoutFailure = async (
  order: PaymentOrderResult['order'],
  err: any,
) => {
  const metadata = failureMetadata(err);
  const gatewayOrderId =
    metadata.order_id || metadata.razorpay_order_id || order?.gatewayOrderId;
  const gatewayPaymentId =
    metadata.payment_id || metadata.razorpay_payment_id || err?.razorpay_payment_id;

  if (!gatewayOrderId || !gatewayPaymentId) return;

  try {
    await recordPaymentFailure({
      gatewayOrderId,
      gatewayPaymentId,
      error: serializeFailure(err),
    });
  } catch (recordErr) {
    console.log('PAYMENT FAILURE RECORD ERR:', JSON.stringify(recordErr));
  }
};

export async function openRazorpayOrder(
  orderResult: PaymentOrderResult,
  description: string,
  userInfo?: UserInfo,
): Promise<PaymentResult> {
  const order = orderResult?.order;
  const keyId = orderResult?.keyId;

  try {
    if (!order?.gatewayOrderId || !keyId) {
      return { success: false, message: 'Could not create payment order' };
    }

    const amount = Math.round(Number(order.amount || 0) * 100);
    if (!amount) {
      return { success: false, message: 'Invalid payment amount' };
    }

    const options = {
      key: keyId,
      order_id: order.gatewayOrderId,
      amount,
      currency: order.currency || 'INR',
      name: 'Shubha Kalyana',
      description: order.taxRate
        ? `${description} incl. ${order.taxRate}% GST`
        : description,
      prefill: {
        name: userInfo?.name || '',
        email: userInfo?.email || '',
        contact: userInfo?.contact || '',
      },
      theme: { color: '#D20236' },
    };

    const payment: any = await RazorpayCheckout.open(options);

    await verifyPayment({
      razorpay_order_id: payment.razorpay_order_id,
      razorpay_payment_id: payment.razorpay_payment_id,
      razorpay_signature: payment.razorpay_signature,
    });

    return { success: true };
  } catch (err: any) {
    console.log(
      'RAZORPAY/VERIFY ERR:',
      JSON.stringify(err),
      '| STATUS:',
      err?.response?.status,
      '| DATA:',
      JSON.stringify(err?.response?.data),
    );
    await recordCheckoutFailure(order, err);
    return { success: false, message: paymentErrorMessage(err, 'Payment cancelled or failed') };
  }
}

export async function payToUnlockProfile(
  profileId: string,
  userInfo?: UserInfo,
): Promise<PaymentResult> {
  try {
    const data = await createProfileUnlockOrder(profileId);
    return openRazorpayOrder(data, 'Unlock Profile Access', userInfo);
  } catch (err: any) {
    console.log(
      'PROFILE UNLOCK ORDER ERR:',
      JSON.stringify(err),
      '| STATUS:',
      err?.response?.status,
      '| DATA:',
      JSON.stringify(err?.response?.data),
    );
    return { success: false, message: paymentErrorMessage(err, 'Could not create payment order') };
  }
}

export async function payForMembership(
  planId: string,
  userInfo?: UserInfo,
): Promise<PaymentResult> {
  try {
    const data = await createMembershipOrder(planId);
    return openRazorpayOrder(data, 'Membership Plan', userInfo);
  } catch (err: any) {
    console.log(
      'MEMBERSHIP ORDER ERR:',
      JSON.stringify(err),
      '| STATUS:',
      err?.response?.status,
      '| DATA:',
      JSON.stringify(err?.response?.data),
    );
    return { success: false, message: paymentErrorMessage(err, 'Could not create membership order') };
  }
}
