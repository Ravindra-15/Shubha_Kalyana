import RazorpayCheckout from 'react-native-razorpay';
import { createProfileUnlockOrder, verifyPayment } from '../api/membershipPayment';
import { createMembershipOrder } from '../api/membershipPlans';
import type { PaymentOrderResult } from './paymentBreakup';

type PaymentResult = { success: boolean; message?: string };
type UserInfo = { name?: string; email?: string; contact?: string };

const paymentErrorMessage = (err: any, fallback: string) =>
  err?.description || err?.response?.data?.message || err?.message || fallback;

export async function openRazorpayOrder(
  orderResult: PaymentOrderResult,
  description: string,
  userInfo?: UserInfo,
): Promise<PaymentResult> {
  try {
    const order = orderResult?.order;
    const keyId = orderResult?.keyId;
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
