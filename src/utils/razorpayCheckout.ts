import RazorpayCheckout from 'react-native-razorpay';
import { createProfileUnlockOrder, verifyPayment } from '../api/membershipPayment';
import { createMembershipOrder } from '../api/membershipPlans';

type UnlockResult = { success: boolean; message?: string };

// Runs the full ₹99 profile-unlock payment flow
export async function payToUnlockProfile(
  profileId: string,
  userInfo?: { name?: string; email?: string; contact?: string }
): Promise<UnlockResult> {
  try {
    // 1. create order on backend
    const data = await createProfileUnlockOrder(profileId);
    const order = data?.order;
    const keyId = data?.keyId;
    if (!order?.gatewayOrderId || !keyId) {
      return { success: false, message: 'Could not create payment order' };
    }

    // 2. open Razorpay checkout
    const options = {
      key: keyId,
      order_id: order.gatewayOrderId,
      amount: order.amount * 100, // paise
      currency: order.currency || 'INR',
      name: 'Shubha Kalyana',
      description: 'Unlock Profile Access',
      prefill: {
        name: userInfo?.name || '',
        email: userInfo?.email || '',
        contact: userInfo?.contact || '',
      },
      theme: { color: '#D20236' },
    };

    const payment: any = await RazorpayCheckout.open(options);
    // payment = { razorpay_order_id, razorpay_payment_id, razorpay_signature }

    // 3. verify on backend → grants unlock
    await verifyPayment({
      razorpay_order_id: payment.razorpay_order_id,
      razorpay_payment_id: payment.razorpay_payment_id,
      razorpay_signature: payment.razorpay_signature,
    });

    return { success: true };
  } catch (err: any) {
    console.log('RAZORPAY/VERIFY ERR:', JSON.stringify(err), '| STATUS:', err?.response?.status, '| DATA:', JSON.stringify(err?.response?.data));
    const msg = err?.description || err?.response?.data?.message || 'Payment cancelled or failed';
    return { success: false, message: msg };
  }
}

// Runs the full membership plan purchase flow
export async function payForMembership(
  planId: string,
  userInfo?: { name?: string; email?: string; contact?: string }
): Promise<UnlockResult> {
  try {
    const data = await createMembershipOrder(planId);
    const order = data?.order;
    const keyId = data?.keyId;
    if (!order?.gatewayOrderId || !keyId) {
      return { success: false, message: 'Could not create membership order' };
    }

    const options = {
      key: keyId,
      order_id: order.gatewayOrderId,
      amount: order.amount * 100,
      currency: order.currency || 'INR',
      name: 'Shubha Kalyana',
      description: 'Membership Plan',
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
    console.log('RAZORPAY/VERIFY ERR (MEMBERSHIP):', JSON.stringify(err), '| STATUS:', err?.response?.status, '| DATA:', JSON.stringify(err?.response?.data));
    const msg = err?.description || err?.response?.data?.message || 'Payment cancelled or failed';
    return { success: false, message: msg };
  }
}