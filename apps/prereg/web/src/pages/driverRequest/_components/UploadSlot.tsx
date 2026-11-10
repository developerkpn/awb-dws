import { useState, type DragEvent } from 'react'
import { Skeleton } from '@awb/ui'
import { CheckCircle, FileText, Upload } from '@/ui/icons'
import { useUploadDocument } from '@/hooks/driverRequest'
import { DocumentPreview } from '@/components/DocumentPreview'
import { getErrorMessage } from '@/utils/errorHandler'
import type { UploadSlotProps } from '@/types/driverRequest'

const ACCEPTED = ['image/jpeg', 'image/png', 'application/pdf']
const MAX_BYTES = 5 * 1024 * 1024

export function UploadSlot({
  label,
  category,
  currentUrl,
  onChange,
  disabled,
  onPending,
  required = false,
  error: fieldError,
}: UploadSlotProps) {
  const upload = useUploadDocument()
  const [error, setError] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const [previewFailed, setPreviewFailed] = useState(false)
  const [previewing, setPreviewing] = useState(false)

  const [file, setFile] = useState<{
    name: string
    image: boolean
  } | null>(null)

  const busy = disabled || upload.isPending
  const showImage = Boolean(currentUrl) && (file ? file.image : !previewFailed)

  const send = async (picked?: File) => {
    if (!picked || busy) return

    if (!ACCEPTED.includes(picked.type)) {
      setError('Use a JPEG, PNG or PDF file.')

      return
    }

    if (picked.size > MAX_BYTES) {
      setError('The file is larger than 5 MB.')

      return
    }

    setError(null)
    onPending(category, true)

    try {
      const result = await upload.mutateAsync({
        file: picked,
        category,
      })

      setFile({
        name: result.fileName,
        image: result.mimeType.startsWith('image/'),
      })

      setPreviewFailed(false)
      onChange(result.url)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      onPending(category, false)
    }
  }

  const drop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault()
    setDragging(false)
    void send(event.dataTransfer.files[0])
  }

  const tone = dragging
    ? 'border-brand-400 bg-brand-50'
    : error || (fieldError && !currentUrl)
      ? 'border-rose-300 bg-rose-50/60'
      : currentUrl
        ? 'border-solid border-stone-200 bg-white'
        : 'border-stone-300 bg-stone-50 hover:border-stone-400 hover:bg-stone-100'

  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm font-medium text-stone-700">
          {label}
          {required && (
            <span aria-hidden="true" className="text-brand-600">
              {' '}
              *
            </span>
          )}
        </span>
        {!required && <span className="text-xs text-stone-400">Optional</span>}
      </div>
      <label
        className={`group relative flex h-44 cursor-pointer flex-col rounded-xl border-2 border-dashed p-3 transition-colors focus-within:ring-2 focus-within:ring-brand-500 focus-within:ring-offset-2 ${tone} ${busy ? 'cursor-wait' : ''}`}
        onDragOver={(event) => {
          event.preventDefault()

          if (!busy) setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={drop}
      >
        <input
          type="file"
          className="sr-only"
          aria-label={label}
          accept={ACCEPTED.join(',')}
          disabled={busy}
          onChange={(event) => {
            void send(event.target.files?.[0])
            event.target.value = ''
          }}
        />
        {upload.isPending ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3">
            <Skeleton
              style={{
                width: '3rem',
                height: '3rem',
                borderRadius: '0.75rem',
              }}
            />
            <span className="text-sm text-stone-500">Uploading…</span>
          </div>
        ) : currentUrl ? (
          <div className="flex min-h-0 flex-1 flex-col gap-2">
            <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-lg bg-stone-100">
              {showImage ? (
                <img
                  src={currentUrl}
                  alt={`${label} preview`}
                  className="h-full w-full object-cover"
                  onError={() => setPreviewFailed(true)}
                />
              ) : (
                <FileText className="size-10 text-stone-400" />
              )}
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex min-w-0 items-center gap-1 text-xs font-medium text-emerald-700">
                <CheckCircle className="size-4 shrink-0" />
                <span className="truncate">{file?.name ?? 'Uploaded'}</span>
                {file && <span className="sr-only">Uploaded</span>}
              </span>
              <span className="flex shrink-0 gap-3 text-xs font-medium">
                <button
                  type="button"
                  className="text-stone-700 hover:underline"
                  onClick={(event) => {
                    event.preventDefault()
                    setPreviewing(true)
                  }}
                >
                  View
                </button>
                <span className="text-stone-500 group-hover:text-stone-800">Replace</span>
              </span>
            </div>
          </div>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
            <span className="flex size-11 items-center justify-center rounded-full bg-white shadow-xs ring-1 ring-stone-200">
              <Upload className="size-5 text-stone-500" />
            </span>
            <span className="text-sm font-medium text-stone-700">
              {dragging ? 'Drop to upload' : 'Click or drag a file here'}
            </span>
            <span className="text-xs text-stone-500">JPEG, PNG or PDF · up to 5 MB</span>
          </div>
        )}
      </label>
      <DocumentPreview
        document={
          previewing && currentUrl
            ? {
                url: currentUrl,
                label,
              }
            : null
        }
        onClose={() => setPreviewing(false)}
      />
      {(error || (fieldError && !currentUrl)) && (
        <p role="alert" className="text-xs text-rose-600">
          {error ?? fieldError}
        </p>
      )}
    </div>
  )
}
