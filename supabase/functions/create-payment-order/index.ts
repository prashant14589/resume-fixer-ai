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
    const amountInr = Number(body.amountInr ?? 199);
    const keyId = Deno.env.get('RAZORPAY_KEY_ID');
    const keySecret = Deno.env.get('RAZORPAY_KEY_SECRET');

    if (!keyId || !keySecret) {
      throw new Error('Razorpay keys are missing from function secrets.');
    }

    const auth = btoa(`${keyId}:${keySecret}`);

    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: amountInr * 100,
        currency: 'INR',
        receipt: `resume_fix_${Date.now()}`,
      }),
    });

    if (!response.ok) {
      throw new Error(`Razorpay order failed: ${await response.text()}`);
    }

    const data = await response.json();

    return json({
      amount: data.amount,
      currency: data.currency,
      keyId,
      orderId: data.id,
    });
  } catch (error) {
    return json(
      {
        error: 'Failed to create Razorpay order',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

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
