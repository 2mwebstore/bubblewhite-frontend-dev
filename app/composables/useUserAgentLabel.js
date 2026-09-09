// Turns a raw User-Agent string into something an admin can actually
// read at a glance ("Chrome · Windows") instead of the full, very long
// raw string. Deliberately simple pattern matching, not a full UA-parsing
// library — good enough to recognize the common browsers/OSes that show
// up in a small store's own audit log, not meant to be exhaustively
// correct for every device that's ever existed. The full raw string is
// still shown via a title attribute (hover tooltip) wherever this is
// used, so nothing is actually lost for the rare case this guesses wrong.
export function parseUserAgent(ua) {
  if (!ua) return '—'

  let browser = 'Unknown'
  if (ua.includes('Edg/')) browser = 'Edge'
  else if (ua.includes('OPR/') || ua.includes('Opera')) browser = 'Opera'
  else if (ua.includes('Chrome/')) browser = 'Chrome'
  else if (ua.includes('CriOS/')) browser = 'Chrome' // Chrome on iOS identifies itself differently
  else if (ua.includes('Firefox/') || ua.includes('FxiOS/')) browser = 'Firefox'
  else if (ua.includes('Safari/') && !ua.includes('Chrome')) browser = 'Safari'

  let os = 'Unknown'
  if (ua.includes('iPhone')) os = 'iPhone'
  else if (ua.includes('iPad')) os = 'iPad'
  else if (ua.includes('Android')) os = 'Android'
  else if (ua.includes('Windows')) os = 'Windows'
  else if (ua.includes('Mac OS X') || ua.includes('Macintosh')) os = 'macOS'
  else if (ua.includes('Linux')) os = 'Linux'

  return `${browser} · ${os}`
}
