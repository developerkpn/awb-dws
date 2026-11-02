import { NotFoundError } from '@awb/server-core'
import preRegistrationRepository from './pre-registration.repository'

export default {
  async findByIdOrFail(id: string) {
    const preRegistration = await preRegistrationRepository.findById(id)
    if (!preRegistration) throw new NotFoundError('Pre-registration not found')
    return preRegistration
  },
}
