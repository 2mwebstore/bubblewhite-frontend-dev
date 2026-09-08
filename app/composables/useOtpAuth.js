// Handles the API side of phone OTP verification — used by both login
// (an alternative to password) and register (required there, and now the
// FINAL step: the full form is submitted first via registerRequestOTP,
// phone verification confirms it). The actual UI flow (phone entry,
// showing the Telegram button vs a code field, etc.) lives in
// PhoneOtpVerification.vue / OtpCodeEntry.vue; this composable is just
// the backend calls they need.

import { useCustomerApi } from './useCustomerApi'

export function useOtpAuth() {
  const api = useCustomerApi()

  return {
    // Login-via-OTP: phone only, no account gets created off the back of
    // this — see verifyOTP below for what happens if no account exists
    // yet. Tries the free Telegram channel first — response tells the
    // caller which of two states this is in:
    //  - channel: 'telegram_sent' — a code was already sent, show the
    //    code entry field immediately.
    //  - channel: 'telegram_pending' + telegramLinkUrl — no Telegram
    //    linked yet for this phone; show the "Open Telegram" button
    //    pointing at telegramLinkUrl, alongside a "Send via SMS instead"
    //    option that calls requestOTPBySMS.
    requestOTP: (phone) => api.post('/customer/otp/request', { phone }),

    // Registration: the FULL form (name, phone, email, password) is
    // collected and submitted here FIRST — nothing is created yet, this
    // only validates, checks phone/email aren't taken, and sends the
    // code. Same response shape as requestOTP above (channel/
    // telegramLinkUrl) since it's the same underlying delivery mechanism.
    // The account itself is only created once verifyOTP below confirms
    // the code.
    registerRequestOTP: (name, phone, email, password) =>
      api.post('/customer/register/request-otp', { name, phone, email, password }),

    // The customer's own explicit choice — no Telegram, or just prefers
    // SMS. Costs real money per call (Plasgate), so this is never called
    // automatically as a fallback from requestOTP/registerRequestOTP.
    requestOTPBySMS: (phone) => api.post('/customer/otp/request-sms', { phone }),

    // Two possible successful shapes:
    //  - { token, customer } — either an account already existed for
    //    this phone (login-via-OTP), or this verification just completed
    //    a registration and the account was created right now. Log in
    //    directly either way, identical shape to every other login path.
    //  - { needsRegistration: true } — a login-via-OTP attempt for a
    //    phone with no account and no registration in progress; the
    //    caller should send the customer to the registration form.
    verifyOTP: (phone, code) => api.post('/customer/otp/verify', { phone, code }),
  }
}
