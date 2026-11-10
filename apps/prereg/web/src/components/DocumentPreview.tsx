import { Skeleton } from '@awb/ui'
import { Modal } from '@/ui/Modal'
import { FileDownload, FileText } from '@/ui/icons'
import { useDocumentFile, useObjectUrl } from '@/hooks/document'
import { getErrorMessage } from '@/utils/errorHandler'
import type { DocumentPreviewProps } from '@/types/document'

export function DocumentPreview({ document, onClose }: DocumentPreviewProps) {
  const file = useDocumentFile(document?.url ?? null)
  const objectUrl = useObjectUrl(file.data?.blob)

  if (!document) return null

  const type = file.data?.blob.type ?? ''

  return (
    <Modal title={document.label} onClose={onClose} size="lg">
      <div className="space-y-4">
        <div className="flex min-h-72 items-center justify-center overflow-hidden rounded-xl bg-stone-100">
          {file.isLoading || (file.data && !objectUrl) ? (
            <Skeleton
              style={{
                width: '100%',
                height: '18rem',
              }}
            />
          ) : file.isError ? (
            <p className="p-6 text-sm text-rose-700">{getErrorMessage(file.error)}</p>
          ) : type.startsWith('image/') ? (
            <img
              src={objectUrl!}
              alt={document.label}
              className="max-h-[65vh] w-full object-contain"
            />
          ) : type === 'application/pdf' ? (
            <iframe title={document.label} src={objectUrl!} className="h-[65vh] w-full" />
          ) : (
            <div className="flex flex-col items-center gap-2 p-8 text-sm text-stone-500">
              <FileText className="size-10 text-stone-400" />
              No preview for this file type.
            </div>
          )}
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="min-w-0 truncate text-sm text-stone-600">
            {file.data?.fileName ?? ''}
          </span>
          {objectUrl && file.data && (
            <a
              href={objectUrl}
              download={file.data.fileName}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-sm font-medium text-stone-700 hover:bg-stone-50"
            >
              <FileDownload className="size-4" />
              Download
            </a>
          )}
        </div>
      </div>
    </Modal>
  )
}
