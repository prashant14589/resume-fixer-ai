# Privacy Policy — Resume Fixer AI

**Last updated:** April 6, 2026

This Privacy Policy explains how Resume Fixer AI ("we", "our", "the app") handles your personal data. It is written in plain English because our users are Indian job seekers, not lawyers.

---

## 1. Who We Are

Resume Fixer AI is an independent mobile application that helps job seekers improve their resumes using AI analysis. We are operated by an individual developer based in India.

**Contact for privacy matters:**
- Email: [YOUR_EMAIL@example.com]
- Address: [Your Name], [City, State, India]

---

## 2. What Data We Collect — And What We Don't

We collect as little as possible.

| Data | Where It Lives | Shared With |
|------|---------------|-------------|
| Resume text you paste or upload | **Your device only** (AsyncStorage) | OpenAI API (transient, see §4) |
| Job description (optional) | **Your device only** | OpenAI API (transient, see §4) |
| ATS score and analysis results | **Your device only** (max 10 saved) | Not shared |
| Payment transaction ID | **Your device only** | Not shared |
| Payment card details | **Never touches our app** | Razorpay only (PCI-DSS) |

**We do NOT collect:**
- Your name, email, or phone number (no account required)
- Location data
- Device identifiers for tracking purposes
- Crash reports or analytics (not yet integrated)

---

## 3. How We Use Your Data

Your resume text is sent to the OpenAI API to:
- Calculate your ATS (Applicant Tracking System) score
- Identify missing keywords and weak bullet points
- Generate improved resume suggestions (paid feature)

Your data is NOT used for any other purpose.

---

## 4. Third-Party Data Processors

### OpenAI (AI Processing)
Your resume text and job description are sent to OpenAI's API servers (located in the United States) for AI analysis.

**Important:** Per [OpenAI's API data usage policy](https://openai.com/policies/api-data-usage-policies), data sent via the API is **not used to train OpenAI's models**. Data is processed and discarded.

This is a cross-border data transfer from India to the United States. By using the app and giving consent, you acknowledge this transfer.

### Supabase (Server Infrastructure)
Our AI processing runs on Supabase Edge Functions. Requests are processed transiently — **no resume data is stored on Supabase servers**.

### Razorpay (Payments)
Payments are processed by Razorpay, which is RBI-regulated and PCI-DSS compliant. We never see or store your card, UPI, or bank details. Razorpay retains payment records per their own privacy policy.

---

## 5. Data Retention

- All your data (resume text, scores, history) is stored **only on your device**
- When you delete the app, all data is permanently deleted
- We have no server-side database of your personal information
- Razorpay maintains their own payment records per their retention policy

---

## 6. Your Rights Under the DPDP Act 2023

Under India's Digital Personal Data Protection Act, 2023, you have the following rights:

**Right to Access:** You can view all your data directly in the app (History screen).

**Right to Correction:** You can delete history records and re-analyze with corrected information.

**Right to Erasure:** Delete the app from your device. All locally stored data is immediately and permanently removed.

**Right to Withdraw Consent:** You can uncheck the consent checkbox at any time before analysis. Previously processed data cannot be retrieved from our servers (we don't store it).

**Right to Grievance Redressal:** Contact us at [YOUR_EMAIL@example.com] with concerns. We will respond within 30 days.

**Right to File a Complaint:** You may file a complaint with the Data Protection Board of India once operational.

---

## 7. Children's Data

This app is intended for adults (18+) seeking employment. We do not knowingly collect data from children under 18.

---

## 8. Security

- All communication between the app and our servers uses HTTPS/TLS encryption
- Payment signature verification uses HMAC-SHA256 cryptography
- No sensitive credentials are stored in the app bundle

---

## 9. Changes to This Policy

We will update this page if our data practices change. Significant changes will be noted in the app on next launch.

---

## 10. Contact Us

For privacy questions or to exercise your rights:

**Email:** [YOUR_EMAIL@example.com]
**Address:** [Your Name], [City, State, PIN], India

We aim to respond within 30 days.
