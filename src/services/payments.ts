import { Platform } from 'react-native';

import { addCredits } from './entitlement';
import { invokeSupabaseFunction } from './supabase';

type CreateOrderResponse = {
  amount: number;
  currency: string;
  keyId: string;
  orderId: string;
};

type VerifyPaymentResponse = {
  paymentId: string;
  verified: boolean;
};

export async function startRazorpayPayment() {
  if (Platform.OS === 'web') {
    throw new Error('Razorpay checkout needs a native Android build. Web preview cannot complete real payments.');
  }

  const order = await invokeSupabaseFunction<CreateOrderResponse>('create-payment-order', {
    amountInr: 199,
  });

  const RazorpayCheckout = require('react-native-razorpay').default;

  const result = await RazorpayCheckout.open({
    amount: order.amount,
    currency: order.currency,
    description: 'AI resume rewrite — one-time unlock',
    key: order.keyId,
    name: 'Resume Fixer AI',
    order_id: order.orderId,
    prefill: {
      contact: '9000000000',
      email: 'user@resumefixer.ai',
    },
    notes: {
      product: 'resume_rewrite',
    },
    theme: { color: '#76E4C3' },
  });

  const verification = await invokeSupabaseFunction<VerifyPaymentResponse>('verify-payment', {
    razorpayOrderId: result.razorpay_order_id,
    razorpayPaymentId: result.razorpay_payment_id,
    razorpaySignature: result.razorpay_signature,
  });

  if (!verification.verified) {
    throw new Error('Payment verification failed.');
  }

  await addCredits(1);

  return verification.paymentId;
}
