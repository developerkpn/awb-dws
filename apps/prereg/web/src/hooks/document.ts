import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { DocumentFile } from '@/types/document'

export function useDocumentFile(url: string | null) {
  return useQuery({
    queryKey: ['document-file', url],
    enabled: Boolean(url),
    staleTime: 60_000,
    queryFn: async ({ signal }): Promise<DocumentFile> => {
      const response = await fetch(url!, {
        credentials: 'same-origin',
        signal,
      })

      if (!response.ok)
        throw new Error(
          response.status === 404
            ? 'Document not found.'
            : response.status === 403
              ? 'You do not have permission to view this document.'
              : 'The document could not be loaded.',
        )

      const name = /filename\*=UTF-8''([^;]+)/i.exec(
        response.headers.get('Content-Disposition') ?? '',
      )?.[1]

      return {
        blob: await response.blob(),
        fileName: name ? decodeURIComponent(name) : 'document',
      }
    },
  })
}

export function useObjectUrl(blob?: Blob) {
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!blob) return setUrl(null)

    const next = URL.createObjectURL(blob)

    setUrl(next)

    return () => URL.revokeObjectURL(next)
  }, [blob])

  return url
}
