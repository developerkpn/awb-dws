import repository from './sync.repository'

export default {
  async getOutboxMessages(after: number, limit: number, siteId: string) {
    const messages = await repository.listOutbox(after, limit, siteId)
    const last = messages.at(-1)

    return {
      messages: messages.map((m) => ({
        id: m.id,
        eventId: m.eventId,
        eventType: m.eventType,
        siteId: m.siteId,
        aggregateId: m.aggregateId,
        status: m.status,
        payload: m.payload,
        createdAt: m.createdAt.toISOString(),
      })),
      lastId: last ? last.id : after,
    }
  },

  async acknowledge(upTo: number, siteId: string) {
    const result = await repository.acknowledge(upTo, siteId)

    return {
      acknowledgedCount: result.count,
      upTo,
    }
  },
}
