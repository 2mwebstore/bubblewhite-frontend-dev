// Restricts phone number input to a leading "+" (only at the very start,
// since a "+" partway through a number is never valid) plus digits —
// nothing else. Used as an @input handler on every phone field in the
// app (register, profile, OTP login, checkout) so a customer physically
// can't type letters or stray punctuation into a phone field in the
// first place, rather than only rejecting it after the fact on submit.
//
// Usage:
//   <input :value="form.phone" @input="form.phone = sanitizePhoneInput($event.target.value)" />
export function sanitizePhoneInput(value) {
  if (!value) return ''
  const leadingPlus = value.startsWith('+') ? '+' : ''
  const digits = value.replace(/[^0-9]/g, '')
  return leadingPlus + digits
}
