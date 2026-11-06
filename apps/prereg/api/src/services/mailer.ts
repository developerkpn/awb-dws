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
    console.info('[AWB development credentials]', { username, password })
}

export function notifyLogisticsSubmission(
  requestId: string,
  driverName: string,
  plateNumber: string,
) {
  if (env.NODE_ENV === 'development') {
    console.info('[AWB logistics notification]', {
      event: 'DRIVER_REQUEST_SUBMITTED',
      requestId,
      driverName,
      plateNumber,
      message: 'New driver and vehicle request submitted. Pending Logistics review.',
    })
  }
}
