import { z } from 'zod'

const multiple = (value: unknown) =>
  value === undefined ? [] : typeof value === 'string' ? [value] : value

export const accountSelectionFilters = z.object({
  roles: z
    .preprocess(multiple, z.array(z.string().trim().min(1).max(50)).max(100))
    .transform((values) => [...new Set(values)]),
  plantIds: z
    .preprocess(multiple, z.array(z.uuid()).max(100))
    .transform((values) => [...new Set(values)]),
})
export type AccountSelectionFilters = z.infer<typeof accountSelectionFilters>
