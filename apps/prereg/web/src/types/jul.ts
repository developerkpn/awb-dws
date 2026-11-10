import type {
  JulDocumentChoice,
  JulDraftInput,
  JulRequestLine,
  JulRequestSummary,
} from '@awb/contracts'

export interface JulConfiguration {
  canReview: boolean
  customers: { id: string; name: string; username: string; role: { code: string } }[]
}
export interface JulListResponse {
  items: JulRequestSummary[]
  total: number
  page: number
  limit: number
}
export interface JulTransportModeOption {
  code: string
  name: string
}
export interface JulDocumentOption extends JulDocumentChoice {
  transportModes: JulTransportModeOption[]
}

export interface JulDocumentDetailsProps {
  document: JulDocumentOption
  allocated: string[]
}

export type EditableLine = JulDraftInput['lines'][number] & {
  key: string
  reference: string
  description: string
  uom: string
  sapPlant?: string
  available?: string
  modes: JulTransportModeOption[]
}

export interface JulLineEditorProps {
  line: EditableLine
  index: number
  customerId?: string
  update: (line: EditableLine) => void
  remove: () => void
  multi?: {
    lines: EditableLine[]
    updateQuantity: (key: string, quantity: string) => void
    removeLine: (key: string) => void
  }
}

export interface ApprovalSelection {
  id: string
  factoryStorage: string
  otherStorage: string
  factoryValuation: string
  otherValuation: string
  factoryBatch: string
  otherBatch: string
}

export interface JulReviewLineProps {
  line: JulRequestLine
  selected?: ApprovalSelection
  change: (value?: ApprovalSelection) => void
}
