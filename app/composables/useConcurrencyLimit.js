/**
 * Runs `files.map(fn)` like Promise.allSettled, but only `limit` requests
 * are ever in flight at once — the rest queue and start as earlier ones
 * finish. Selecting 50+ images and firing them all as simultaneous POSTs
 * blows past the browser's per-origin connection limit and can overwhelm
 * the backend/R2, which shows up as "no response / Load failed" on most of
 * them. A small worker-pool like this keeps every upload actually
 * completing, just staggered.
 *
 * @param {any[]} items
 * @param {(item: any, index: number) => Promise<any>} fn
 * @param {number} limit
 * @param {(done: number, total: number) => void} [onProgress]
 * @returns {Promise<Array<{status: 'fulfilled', value: any} | {status: 'rejected', reason: any}>>}
 */
export async function runWithConcurrencyLimit(items, fn, limit = 4, onProgress) {
  const results = new Array(items.length)
  let nextIndex = 0
  let completed = 0

  async function worker() {
    while (nextIndex < items.length) {
      const i = nextIndex++
      try {
        const value = await fn(items[i], i)
        results[i] = { status: 'fulfilled', value }
      } catch (reason) {
        results[i] = { status: 'rejected', reason }
      } finally {
        completed++
        onProgress?.(completed, items.length)
      }
    }
  }

  const workerCount = Math.min(limit, items.length)
  await Promise.all(Array.from({ length: workerCount }, () => worker()))
  return results
}
