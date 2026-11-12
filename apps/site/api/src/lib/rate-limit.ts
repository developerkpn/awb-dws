const WINDOW_MS = 900_000
const hits = new Map<string, { bucket: number; count: number }>()

/** Counts one attempt for the key in the current 15-minute window and returns the total so far. */
export function consumeAttempt(key: string) {
  const bucket = Math.floor(Date.now() / WINDOW_MS)
  const current = hits.get(key)
  const count = current?.bucket === bucket ? current.count + 1 : 1

  hits.set(key, {
    bucket,
    count,
  })

  if (hits.size > 10_000) {
    for (const [entry, value] of hits) if (value.bucket !== bucket) hits.delete(entry)
  }

  return count
}
