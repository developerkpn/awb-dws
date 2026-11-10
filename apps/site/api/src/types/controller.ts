import type { z } from 'zod'
import type { controllerSchema } from '../config/controllers'

export type ControllerConfig = z.infer<typeof controllerSchema>

export type ControllerEvent =
  | { type: 'rfid.tap'; controllerId: string; cardUid: string; at: Date }
  | {
      type: 'sensor.state'
      controllerId: string
      sensor: string
      state: 'on' | 'off' | 'unknown'
      at: Date
    }
  | { type: 'raw'; controllerId: string; data: Buffer; at: Date }

export type ControllerStatus = 'connecting' | 'connected' | 'disconnected'

export type ControllerConnectionEvents = { data: [Buffer]; status: [ControllerStatus] }
