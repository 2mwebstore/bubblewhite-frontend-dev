// A customer can end up verifying their phone via OTP on the LOGIN page
// (they were trying to sign in) only to discover no account exists yet.
// Rather than sending them to /register to verify all over again, this
// carries the already-verified phone + single-use token across that one
// client-side navigation.
//
// Deliberately just an in-memory ref (useState, not localStorage/a query
// param): a verification token is sensitive and single-use, so it
// shouldn't linger in the URL bar or browser history, and it doesn't need
// to survive a real page reload — if the customer refreshes mid-handoff,
// re-verifying is an acceptable fallback for something this narrow.
export function usePendingPhoneVerification() {
  return useState('pending-phone-verification', () => null) // { phone, verificationToken } | null
}
