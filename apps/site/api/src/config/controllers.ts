import { z } from 'zod'
import { env } from './env'
import type { ControllerConfig } from '../types/controller'

/** Weighbridge controllers this plant connects to (2 per weighbridge), from CONTROLLERS (JSON). */
export const controllerSchema = z.object({
  id: z.string().min(1),
  weighbridgeId: z.string().min(1),
  host: z.string().min(1),
  port: z.int().positive(),
})

export const controllers: ControllerConfig[] = z
  .array(controllerSchema)
  .parse(JSON.parse(env.CONTROLLERS))
