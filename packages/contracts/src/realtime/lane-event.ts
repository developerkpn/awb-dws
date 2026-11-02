import { z } from 'zod'

export const wbSessionPhase = z.enum([
  'IDLE',
  'ENTRY_ALLOWED',
  'POSITION_WAIT',
  'POSITIONED',
  'TAP1_VERIFIED',
  'READY_TO_CAPTURE',
  'CAPTURED',
  'COMMITTED',
  'EXIT_AUTHORIZED',
  'PLATFORM_CLEAR',
  'RELEASED',
  'FAULT',
])
export type WbSessionPhase = z.infer<typeof wbSessionPhase>

export const laneScreenEvent = z.object({
  laneId: z.string(),
  phase: wbSessionPhase,
  journeyId: z.string().optional(),
  message: z.string().optional(),
  at: z.iso.datetime(),
})
export type LaneScreenEvent = z.infer<typeof laneScreenEvent>
