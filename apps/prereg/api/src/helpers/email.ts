import { env } from '../config/env'

export type EmailMessage = {
  to: string
  subject: string
  text: string
  html?: string
}

const sentEmails: EmailMessage[] = []

export const emailService = {
  async sendMail(msg: EmailMessage): Promise<void> {
    sentEmails.push(msg)

    // Skip network call in test mode
    if (env.NODE_ENV === 'test') return

    // In dev / production, log or dispatch through SMTP
    console.log(`[EmailService] Sending email to: ${msg.to} | Subject: ${msg.subject}`)
  },

  async sendNewAccountCredentials(to: string, name: string, username: string, password: string, role: string): Promise<void> {
    const text = `Halo ${name},\n\nAkun Anda sebagai mitra (${role}) telah dibuat oleh Admin.\nUsername: ${username}\nPassword: ${password}\n\nSilakan login ke portal AWB Pre-Registration.\nTerima kasih.`
    await this.sendMail({
      to,
      subject: 'Akun AWB Pre-Registration Anda Telah Dibuat',
      text,
    })
  },

  async sendPasswordReset(to: string, name: string, password: string): Promise<void> {
    const text = `Halo ${name},\n\nPassword akun Anda telah berhasil di-reset.\nPassword baru Anda: ${password}\n\nSilakan gunakan password baru ini untuk login ke portal AWB Pre-Registration.\nTerima kasih.`
    await this.sendMail({
      to,
      subject: 'Reset Password Akun AWB Pre-Registration',
      text,
    })
  },

  async sendOtpEmail(to: string, name: string, otp: string, expiresInMinutes: number): Promise<void> {
    const text = `Halo ${name},\n\nBerikut adalah kode OTP untuk reset password akun AWB Pre-Registration Anda:\n\n${otp}\n\nKode ini berlaku selama ${expiresInMinutes} menit.\nJika Anda tidak meminta reset password, abaikan email ini.\nTerima kasih.`
    await this.sendMail({
      to,
      subject: 'Kode OTP Reset Password AWB Pre-Registration',
      text,
    })
  },

  getSentEmails(): EmailMessage[] {
    return [...sentEmails]
  },

  clearSentEmails(): void {
    sentEmails.length = 0
  },
}

