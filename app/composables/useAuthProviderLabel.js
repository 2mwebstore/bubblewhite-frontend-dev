// Display helpers for Customer.authProviders (see the backend's own
// customerJSON — the list of sign-in methods currently linked to an
// account, not necessarily just the one used the very first time they
// signed up). Shared between the customer list and detail pages rather
// than duplicated, since both need the exact same label/color mapping.
export function authProviderLabel(provider) {
  return { google: 'Google', facebook: 'Facebook', phone: 'លេខទូរស័ព្ទ' }[provider] || provider
}

export function authProviderClass(provider) {
  return {
    google: 'bg-blue-100 text-blue-700',
    facebook: 'bg-indigo-100 text-indigo-700',
    phone: 'bg-green-100 text-green-700',
  }[provider] || 'bg-cream-dark text-ink'
}
