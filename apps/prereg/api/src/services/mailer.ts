import { randomBytes } from 'node:crypto'

export interface SentEmail {
  to: string
  subject: string
  content: string
  sentAt: Date
  tempPassword?: string
}

// In-memory record of sent emails for development, testing, and audit
export const emailOutbox: SentEmail[] = []

/**
 * Generates a strong, random password for system-generated credentials.
 * Contains uppercase, lowercase, numbers, and symbols.
 */
export function generateSecurePassword(length = 12): string {
  const charset = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*'
  const bytes = randomBytes(length)
  let password = ''
  for (let i = 0; i < length; i++) {
    password += charset[bytes[i]! % charset.length]
  }
  return password
}

/**
 * Sends system-generated credentials to user's email.
 */
export async function sendPasswordEmail(
  to: string,
  username: string,
  tempPassword: string,
  isReset = false
): Promise<SentEmail> {
  const subject = isReset
    ? '[KPN AWB-DWS] Your Password Has Been Reset'
    : '[KPN AWB-DWS] Welcome - Your Account Credentials'

  const content = isReset
    ? `Hello @${username},\n\nAn administrator has reset your password for KPN AWB-DWS. Your new temporary password is:\n\n${tempPassword}\n\nPlease use this password to sign in.`
    : `Hello @${username},\n\nYour internal staff account for KPN AWB-DWS has been created by the system administrator.\n\nUsername: ${username}\nTemporary Password: ${tempPassword}\n\nPlease use these credentials to log in to the portal.`

  const record: SentEmail = {
    to,
    subject,
    content,
    sentAt: new Date(),
    tempPassword,
  }

  emailOutbox.push(record)
  return record
}
