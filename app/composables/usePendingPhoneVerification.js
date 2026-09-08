// A customer can try logging in via OTP only to discover no account
// exists for that phone yet. Rather than sending them to /register with
// an empty phone field, this carries the phone number across that one
// client-side navigation so it arrives pre-filled — they still go
// through the full register-then-verify flow there (this is NOT a
// verified/trusted claim, just a convenience prefill), since a
// login-via-OTP verification doesn't carry any pending registration data
// with it the way a registration-in-progress one does.
//
// Deliberately just an in-memory ref (useState, not localStorage/a query
// param) — doesn't need to survive a real page reload; if the customer
// refreshes mid-handoff, landing on an empty phone field is an acceptable
// fallback for something this narrow.
export function usePendingPhoneVerification() {
  return useState('pending-phone-verification', () => '') // phone string, or ''
}
