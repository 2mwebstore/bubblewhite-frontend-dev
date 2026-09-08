// Handles the API side of phone OTP verification — used by both login
// (an alternative to password) and register (required there). The actual
// UI flow (phone entry, showing the Telegram button vs a code field, etc.)
// lives in PhoneOtpVerification.vue; this composable is just the three
// backend calls it needs.

import { useCustomerApi } from './useCustomerApi'

export function useOtpAuth() {
  const api = useCustomerApi()

  return {
    // Tries the free Telegram channel first — response tells the caller
    // which of two states this is in:
    //  - channel: 'telegram_sent' — a code was already sent, show the
    //    code entry field immediately.
    //  - channel: 'telegram_pending' + telegramLinkUrl — no Telegram
    //    linked yet for this phone; show the "Open Telegram" button
    //    pointing at telegramLinkUrl, alongside a "Send via SMS instead"
    //    option that calls requestOTPBySMS.
    requestOTP: (phone) => api.post('/customer/otp/request', { phone }),

    // The customer's own explicit choice — no Telegram, or just prefers
    // SMS. Costs real money per call (Plasgate), so this is never called
    // automatically as a fallback from requestOTP.
    requestOTPBySMS: (phone) => api.post('/customer/otp/request-sms', { phone }),

    // Two possible successful shapes, same as the backend's own two
    // branches:
    //  - { token, customer } — an account already existed for this phone,
    //    log in directly (identical shape to every other login path).
    //  - { needsRegistration: true, verificationToken } — no account yet;
    //    the caller should show the "complete your profile" form and
    //    submit it to /customer/register along with this token.
    verifyOTP: (phone, code) => api.post('/customer/otp/verify', { phone, code }),
  }
}
