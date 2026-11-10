import { NotFoundError } from '@awb/server-core'
import journeyRepository from './journey.repository'

export default {
  async findByIdOrFail(id: string) {
    const journey = await journeyRepository.findById(id)

    if (!journey) throw new NotFoundError('Journey not found')

    return journey
  },
}
