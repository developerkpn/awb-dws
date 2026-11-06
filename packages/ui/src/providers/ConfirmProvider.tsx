import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { ConfirmDialog, type ConfirmOptions } from '../organisms/ConfirmDialog'
export type Confirm = (options: ConfirmOptions) => Promise<boolean>
const Context = createContext<Confirm | null>(null)
export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null)
  const resolver = useRef<((value: boolean) => void) | null>(null)
  const focus = useRef<HTMLElement | null>(null)
  const confirm = useCallback<Confirm>((next) => {
    if (resolver.current) return Promise.resolve(false)
    focus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    setOptions(next)
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve
    })
  }, [])
  const finish = useCallback((value: boolean) => {
    resolver.current?.(value)
    resolver.current = null
    setOptions(null)
    requestAnimationFrame(() => focus.current?.focus())
  }, [])
  useEffect(
    () => () => {
      resolver.current?.(false)
      resolver.current = null
    },
    [],
  )
  return (
    <Context value={confirm}>
      {children}
      {options && <ConfirmDialog options={options} onResolve={finish} />}
    </Context>
  )
}
export function useConfirm(): Confirm {
  const confirm = useContext(Context)
  if (!confirm) throw new Error('useConfirm requires ConfirmProvider')
  return confirm
}
