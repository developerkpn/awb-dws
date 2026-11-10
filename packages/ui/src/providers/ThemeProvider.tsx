import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import '../styles/tokens.css'

export type ThemePreference = 'light' | 'dark' | 'system'

interface ThemeContext {
  preference: ThemePreference
  resolved: 'light' | 'dark'
  setPreference: (value: ThemePreference) => void
}
const Context = createContext<ThemeContext | null>(null)
const storageKey = 'awb-ui-theme'

function readPreference(): ThemePreference {
  try {
    const value = localStorage.getItem(storageKey)

    if (value === 'light' || value === 'dark') return value
  } catch {
    return 'system'
  }

  return 'system'
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreference] = useState<ThemePreference>(readPreference)

  const [systemDark, setSystemDark] = useState(
    () => matchMedia('(prefers-color-scheme: dark)').matches,
  )

  const resolved = preference === 'system' ? (systemDark ? 'dark' : 'light') : preference

  useEffect(() => {
    const query = matchMedia('(prefers-color-scheme: dark)')
    const listener = () => setSystemDark(query.matches)

    query.addEventListener('change', listener)

    return () => query.removeEventListener('change', listener)
  }, [])

  useEffect(() => {
    document.documentElement.dataset.theme = resolved
    document.documentElement.style.colorScheme = resolved

    try {
      localStorage.setItem(storageKey, preference)
    } catch {
      return
    }
  }, [preference, resolved])

  useEffect(() => {
    const listener = (event: StorageEvent) => {
      if (event.key === storageKey) setPreference(readPreference())
    }

    globalThis.addEventListener('storage', listener)

    return () => globalThis.removeEventListener('storage', listener)
  }, [])

  return (
    <Context
      value={{
        preference,
        resolved,
        setPreference,
      }}
    >
      {children}
    </Context>
  )
}
export function useTheme() {
  const theme = useContext(Context)

  if (!theme) throw new Error('useTheme requires ThemeProvider')

  return theme
}
