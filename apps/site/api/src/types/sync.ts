export interface PullResult {
  success: boolean
  disconnected: boolean
  processedCount: number
  lastSequence: number
  totalMessages?: number
  error?: string
  ackPending?: boolean
  blockedSequence?: number
  status?: number
}
