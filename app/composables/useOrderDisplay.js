// Shared order-display helpers, consolidated from what used to be four
// near-identical copies (cart.vue, orders/[id].vue, admin/orders/index.vue,
// admin/orders/[id].vue) — confirmed byte-for-byte identical before this
// consolidation, so this carries no behavior change, just removes the
// duplication itself.
//
// Note: this is deliberately a plain function export, not a Vue composable
// with reactive state — these are pure label/color lookups with no state
// to share, so there's no benefit to the composable pattern here (no
// singleton state, no lifecycle hooks), just a shared module of functions.

const PAYMENT_LABELS = {
  bakong: 'Bakong KHQR', // historical only — Bakong's integration was removed, this stays so old orders still display correctly
  ppcbank: 'PPCBank KHQR',
}

export function paymentLabel(method) {
  return PAYMENT_LABELS[method] || 'សាច់ប្រាក់'
}

const PAYMENT_STATUS_LABELS = { unpaid: 'មិនទាន់ទូទាត់', paid: 'បានទូទាត់', failed: 'បរាជ័យ' }
const PAYMENT_STATUS_CLASSES = {
  unpaid: 'bg-amber-100 text-amber-700',
  paid: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
}

export function paymentStatusLabel(status) {
  return PAYMENT_STATUS_LABELS[status] || status
}

export function paymentStatusClass(status) {
  return PAYMENT_STATUS_CLASSES[status] || 'bg-cream-dark text-muted'
}

const STATUS_LABELS = {
  pending: 'កំពុងរង់ចាំ',
  confirmed: 'បានបញ្ជាក់',
  shipped: 'កំពុងដឹកជញ្ជូន',
  completed: 'បានបញ្ចប់',
  cancelled: 'បានលុបចោល',
}
const STATUS_CLASSES = {
  pending: 'bg-amber-100 text-amber-700',
  confirmed: 'bg-blue-100 text-blue-700',
  shipped: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
}

export function statusLabel(status) {
  return STATUS_LABELS[status] || status
}

export function statusClass(status) {
  return STATUS_CLASSES[status] || 'bg-cream-dark text-muted'
}

// Short form — date only, no time. Used for the order HISTORY LIST (cart.vue),
// where a compact list of many rows doesn't need per-order time-of-day detail.
export function formatOrderDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('km-KH', { year: 'numeric', month: 'short', day: 'numeric' })
}

// Long form — date AND time. Used on individual order DETAIL pages (customer
// and admin), where knowing exactly when an order was placed matters more.
// This is a genuinely different format from formatOrderDate above, not just
// a differently-named duplicate — confirmed by comparing all prior copies
// before consolidating, since collapsing a real behavioral difference into
// one function would have been its own bug.
export function formatOrderDateTime(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('km-KH', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}
