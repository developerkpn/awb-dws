import { CustomError } from '@awb/server-core'
import { env } from '../config/env'

export function requireCredentialDelivery() {
  if (env.NODE_ENV === 'production')
    throw new CustomError(
      'Account provisioning and password reset are unavailable until credential delivery is configured',
      503,
    )
}

export function deliverCredentials(username: string, password: string) {
  requireCredentialDelivery()

  if (env.NODE_ENV === 'development')
    console.info('[AWB development credentials]', {
      username,
      password,
    })
}

export function notifyLogisticsSubmission(requestId: string, kind: string, identity: string) {
  if (env.NODE_ENV === 'development') {
    console.info('[AWB logistics notification]', {
      event: kind + '_REQUEST_SUBMITTED',
      requestId,
      identity,
      message: 'New ' + kind.toLowerCase() + ' request submitted. Pending Logistics review.',
    })
  }
}

export function notifySubmitterDecision(
  requestId: string,
  submitter: string,
  decision: 'APPROVED' | 'REJECTED',
  message?: string | null,
) {
  if (env.NODE_ENV === 'development') {
    console.info('[AWB submitter notification]', {
      event: 'DRIVER_REQUEST_' + decision,
      requestId,
      submitter,
      decision,
      message: message ?? null,
    })
  }
}
