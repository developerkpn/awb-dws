import type { z } from 'zod'
import type { SessionUser } from '@awb/contracts'
import repository from './driver-request.repository'
import type { listDriverRequests } from './driver-request.schema'

export default {
  async list(query: z.infer<typeof listDriverRequests>, user: SessionUser) {
    const reviewer =
      user.role === 'ADMIN' ||
      (user.role === 'LOGISTIC' && user.permissions.includes('prereg:approve'))
    const rows = await repository.list(
      {
        ...(!reviewer ? { submittedBy: user.id } : {}),
        ...(query.status ? { status: query.status } : {}),
        ...(query.cursorAt && query.cursorId
          ? {
              OR: [
                { createdAt: { lt: new Date(query.cursorAt) } },
                { createdAt: new Date(query.cursorAt), id: { lt: query.cursorId } },
              ],
            }
          : {}),
      },
      query.limit,
    )
    const items = rows.slice(0, query.limit)
    const last = items.at(-1)

    return {
      items,
      nextCursor:
        rows.length > query.limit && last
          ? { cursorAt: last.createdAt.toISOString(), cursorId: last.id }
          : null,
    }
  },
}
