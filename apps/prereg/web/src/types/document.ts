export interface DocumentPreviewTarget {
  url: string
  label: string
}

export interface DocumentPreviewProps {
  document: DocumentPreviewTarget | null
  onClose: () => void
}

export interface DocumentFile {
  blob: Blob
  fileName: string
}
