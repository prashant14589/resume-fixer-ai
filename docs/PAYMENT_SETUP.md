# Payment Setup

## What is implemented

The app now expects two backend functions:

1. `create-payment-order`
2. `verify-payment`

These are already scaffolded under:

- [supabase/functions/create-payment-order/index.ts](C:/Users/prash/OneDrive/Documents/New%20project/apps/resume-fixer-ai/supabase/functions/create-payment-order/index.ts)
- [supabase/functions/verify-payment/index.ts](C:/Users/prash/OneDrive/Documents/New%20project/apps/resume-fixer-ai/supabase/functions/verify-payment/index.ts)

## Supabase secrets required

Add these secrets in Supabase Edge Functions:

```env
RAZORPAY_KEY_ID=your_key_id
RAZORPAY_KEY_SECRET=your_key_secret
OPENAI_API_KEY=your_openai_key
```

## Deploy

Deploy all three functions:

1. `analyze-resume`
2. `create-payment-order`
3. `verify-payment`

## Important Expo note

`react-native-razorpay` requires a native Android build.

That means:

- it will not complete real payment inside plain web preview
- use an Android dev build or production build for payment testing

## Fastest testing order

1. test free analysis in web
2. build Android dev client
3. test Razorpay order creation
4. test payment verification
5. test PDF download after verified payment
