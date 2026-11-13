import { useEffect, useState } from 'react'

/** The current time, refreshed every `intervalMs` so elapsed times stay current. */
export function useNow(intervalMs = 60_000) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), intervalMs)

    return () => window.clearInterval(id)
  }, [intervalMs])

  return now
}
