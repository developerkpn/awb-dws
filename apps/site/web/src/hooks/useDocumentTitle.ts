import { useEffect } from 'react'

const APP_NAME = 'AWB Plant Console'

export function useDocumentTitle(title?: string) {
  useEffect(() => {
    document.title = title ? `${title} · ${APP_NAME}` : APP_NAME
  }, [title])
}
