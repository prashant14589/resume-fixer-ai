// @ts-nocheck

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  try {
    const body = await request.json();
    const secret = Deno.env.get('RAZORPAY_KEY_SECRET');

    if (!secret) {
      throw new Error('Razorpay secret is missing from function secrets.');
    }

    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = body;

    if (
      typeof razorpayOrderId !== 'string' || !razorpayOrderId ||
      typeof razorpayPaymentId !== 'string' || !razorpayPaymentId ||
      typeof razorpaySignature !== 'string' || !razorpaySignature
    ) {
      return json({ error: 'Missing required payment fields', verified: false }, 400);
    }

    const payload = `${razorpayOrderId}|${razorpayPaymentId}`;
    const keyData = new TextEncoder().encode(secret);
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const signature = await crypto.subtle.sign('HMAC', cryptoKey, new TextEncoder().encode(payload));
    const expected = Array.from(new Uint8Array(signature))
      .map((byte) => byte.toString(16).padStart(2, '0'))
      .join('');

    const verified = timingSafeEqual(expected, razorpaySignature);

    if (!verified) {
      return json({ error: 'Payment signature mismatch', verified: false }, 400);
    }

    return json({
      paymentId: razorpayPaymentId,
      verified: true,
    });
  } catch (error) {
    return json(
      {
        error: 'Failed to verify payment',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

/** Constant-time string comparison to prevent timing attacks on HMAC signatures. */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status,
  });
}

const corsHeaders = {
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Origin': '*',
};
