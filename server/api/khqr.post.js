import { BakongKHQR, khqrData, MerchantInfo } from 'bakong-khqr'
import QRCode from 'qrcode'
import sharp from 'sharp'

// This lives in Nuxt's Nitro server layer (Node.js), not the Go backend —
// bakong-khqr, qrcode, and sharp are npm packages with no Go equivalent,
// and merchant credentials belong server-side regardless (never shipped to
// the client bundle), so a small dedicated endpoint here is simpler than
// round-tripping through Go for no benefit.
//
// POST body: { amount: number, billNumber?: string }
// Returns: { qr, md5, image } — `qr` is the raw KHQR string (used
// server-side for real payment verification, see the Go backend's
// CheckBakongPaymentByMD5), `image` is a ready-to-display data URL with a
// small payment icon composited into the center, `md5` is what Bakong's
// own Open API uses to check whether a specific KHQR was paid.

const ICON_SIZE = 64 // px, relative to the 320px QR — matches roughly a fifth of the QR's width

// The real KHQR-style dollar icon, provided directly rather than
// hand-drawn — already includes its own white ring border + black circle
// + white $ glyph, so it composites straight onto the QR with no separate
// backdrop shape needed.
const CENTER_ICON_SVG = `<svg width="41" height="42" viewBox="0 0 41 42" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M0 20.875C0 32.1968 9.17816 41.375 20.5 41.375C31.8218 41.375 41 32.1968 41 20.875C41 9.55316 31.8218 0.375 20.5 0.375C9.17816 0.375 0 9.55316 0 20.875Z" fill="white"/>
<path d="M20.4998 37.647C29.7631 37.647 37.2725 30.1376 37.2725 20.8743C37.2725 11.611 29.7631 4.10156 20.4998 4.10156C11.2365 4.10156 3.72705 11.611 3.72705 20.8743C3.72705 30.1376 11.2365 37.647 20.4998 37.647Z" fill="black"/>
<path d="M20.7341 32.057C20.4052 32.057 20.0898 31.9261 19.8573 31.6931C19.6247 31.4601 19.4941 31.1441 19.4941 30.8146V29.2243C17.9211 28.8737 16.457 28.1445 15.2284 27.0997C15.0258 26.8746 14.9122 26.583 14.9092 26.2799C14.9062 25.9767 15.014 25.683 15.2121 25.4539C15.4103 25.2248 15.6852 25.0762 15.9851 25.0361C16.285 24.9959 16.5892 25.0671 16.8404 25.2361C17.9125 26.1538 19.2339 26.7292 20.6349 26.8885H20.7589C21.4486 26.9374 22.1302 26.716 22.66 26.2709C23.1898 25.8258 23.5263 25.192 23.5986 24.5031C23.5986 23.8694 23.2638 22.9128 20.3497 22.0182C18.8369 21.5337 15.3896 20.4403 15.3896 17.1976C15.4329 16.0587 15.8656 14.9694 16.6151 14.1121C17.3646 13.2549 18.3854 12.6817 19.5065 12.4888V10.9358C19.5065 10.6063 19.6371 10.2903 19.8697 10.0573C20.1022 9.82426 20.4176 9.69336 20.7465 9.69336C21.0754 9.69336 21.3908 9.82426 21.6233 10.0573C21.8559 10.2903 21.9865 10.6063 21.9865 10.9358V12.4888C23.3704 12.7611 24.5912 13.5691 25.3842 14.7376C25.5625 15.013 25.6247 15.3479 25.5574 15.6692C25.49 15.9905 25.2984 16.2719 25.0246 16.4521C24.7507 16.6269 24.4194 16.687 24.1017 16.6197C23.7841 16.5523 23.5055 16.3628 23.3258 16.0918C23.0312 15.691 22.6434 15.3683 22.1961 15.1517C21.7488 14.9352 21.2554 14.8314 20.7589 14.8494C20.0597 14.7868 19.364 15.0016 18.8213 15.4477C18.2786 15.8939 17.9325 16.5356 17.8573 17.2349C17.8573 18.0921 18.4153 18.8376 21.1309 19.7197C22.3709 20.08 26.091 21.1858 26.091 24.5279C26.0522 25.6747 25.6185 26.7727 24.8636 27.6355C24.1086 28.4984 23.079 29.0729 21.9493 29.2615V30.8518C21.9398 31.1706 21.8084 31.4735 21.5822 31.6978C21.356 31.9222 21.0523 32.0508 20.7341 32.057Z" fill="white"/>
</svg>`

function buildCenterIconBuffer() {
  return sharp(Buffer.from(CENTER_ICON_SVG)).resize(ICON_SIZE, ICON_SIZE).png().toBuffer()
}

// Composites the icon into the center of the QR — the icon SVG already
// carries its own white ring border (see above), so this just places it
// directly rather than building a separate backdrop shape first.
async function renderQrWithLogo(qrBuffer, size) {
  let icon
  try {
    icon = await buildCenterIconBuffer()
  } catch (err) {
    // Cosmetic overlay — if this somehow fails, the QR itself must still
    // work rather than the whole request failing.
    console.error('[khqr] failed to build center icon, generating QR without it:', err?.message || err)
    return qrBuffer
  }

  return sharp(qrBuffer)
    .composite([
      {
        input: icon,
        left: Math.round((size - ICON_SIZE) / 2),
        top: Math.round((size - ICON_SIZE) / 2),
      },
    ])
    .png()
    .toBuffer()
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const amount = Number(body?.amount)

  if (!amount || amount <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'A valid amount is required' })
  }

  // KHQR's billNumber field has a real length limit in the underlying
  // tag-length-value format — truncate defensively rather than let a long
  // order reference silently corrupt the generated string.
  const billNumber = body?.billNumber ? String(body.billNumber).slice(0, 25) : undefined

  // Read directly from process.env, NOT useRuntimeConfig() — Nuxt's
  // runtimeConfig only re-reads env vars at server startup for keys that
  // match ITS OWN naming convention (NUXT_<SCREAMING_SNAKE_KEY>); a custom
  // env var name referenced via `process.env.X` inside nuxt.config.ts only
  // gets evaluated ONCE at build time and bakes in as a static default —
  // silently ignoring the same env var if it's only set at runtime
  // (exactly how Railway and most container platforms inject config).
  // Reading process.env directly HERE, inside the request handler, avoids
  // that trap entirely — this code runs fresh on every request, in the
  // actual running process, so it sees whatever the process's real
  // environment is.
  const bakongAccountId = process.env.BAKONG_ACCOUNT_ID || 'bubblewhite@aclb'
  const bakongMerchantName = process.env.BAKONG_MERCHANT_NAME || 'Bubble White'
  const bakongCity = process.env.BAKONG_CITY || 'Phnom Penh'
  const bakongMerchantId = process.env.BAKONG_MERCHANT_ID || '000000'
  const bakongAcquiringBank = process.env.BAKONG_ACQUIRING_BANK || 'ACLBKHPPXXX'

  const optionalData = {
    currency: khqrData.currency.usd,
    amount,
    billNumber,
    // 5 minutes to scan — matches the visible countdown timer in
    // BakongPaymentModal.vue; both must stay in sync since the KHQR
    // standard itself embeds this same expiry into the QR payload.
    expirationTimestamp: Date.now() + 5 * 60 * 1000,
  }

  const merchantInfo = new MerchantInfo(
    bakongAccountId,
    bakongMerchantName,
    bakongCity,
    bakongMerchantId,
    bakongAcquiringBank,
    optionalData
  )

  const khqr = new BakongKHQR()
  const result = khqr.generateMerchant(merchantInfo)

  if (result.status.code !== 0) {
    throw createError({ statusCode: 500, statusMessage: result.status.message || 'Failed to generate KHQR code' })
  }

  const size = 320
  // High error correction is required here specifically — with a logo
  // covering part of the center, the QR needs enough redundancy in its
  // data to still scan correctly around the covered area.
  const qrBuffer = await QRCode.toBuffer(result.data.qr, { errorCorrectionLevel: 'H', margin: 1, width: size })
  const finalBuffer = await renderQrWithLogo(qrBuffer, size)
  const image = `data:image/png;base64,${finalBuffer.toString('base64')}`

  return { qr: result.data.qr, md5: result.data.md5, image, merchantName: bakongMerchantName }
})
