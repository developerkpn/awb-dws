import request from 'supertest'
import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import app from '../src/app'
import { prisma } from '../src/config/prisma'
import { emailService } from '../src/helpers/email'
import { hashPassword } from '../src/helpers/password'
import { clearAllRateLimits } from '../src/helpers/rate-limit'
import partnerAccountRepository from '../src/modules/partner-account/partner-account.repository'

describe('Authentication & Session Management', () => {
  const runId = Date.now()
  const sapCode = `KUNNR-AUTH-${runId}`
  const customerPassword = 'CustomerSecure123!'
  const adminPassword = 'AdminPassword123!'
  const inactivePassword = 'InactivePwd123!'
  let customerUser: { id: number; email: string }
  let adminUser: { id: number; email: string }
  let inactiveUser: { id: number; email: string }

  beforeAll(async () => {
    // Seed master partner with unique SAP code
    const partner = await partnerAccountRepository.upsertPartnerMaster({
      code: sapCode,
      name: 'PT Mitra Login Makmur',
      role: 'CUSTOMER',
    })

    const customerEmail = `auth_cust_${runId}@mitra.com`
    customerUser = await partnerAccountRepository.createUserWithPartners({
      name: 'Budi Mitra',
      email: customerEmail,
      phone: '081211110000',
      role: 'CUSTOMER',
      passwordHash: hashPassword(customerPassword),
      partnerIds: [partner.id],
    })

    const adminEmail = `auth_admin_${runId}@kpn.com`
    adminUser = await partnerAccountRepository.createUserWithPartners({
      name: 'Super Admin',
      email: adminEmail,
      phone: '081222220000',
      role: 'ADMIN',
      passwordHash: hashPassword(adminPassword),
      partnerIds: [],
    })

    const inactiveEmail = `auth_inactive_${runId}@mitra.com`
    inactiveUser = await partnerAccountRepository.createUserWithPartners({
      name: 'User Inactive',
      email: inactiveEmail,
      phone: '081233330000',
      role: 'CUSTOMER',
      passwordHash: hashPassword(inactivePassword),
      partnerIds: [],
    })
    await partnerAccountRepository.updateUserStatus(inactiveUser.id, false)
  })

  beforeEach(() => {
    clearAllRateLimits()
    emailService.clearSentEmails()
  })

  describe('Login (POST /api/auth/login)', () => {
    it('berhasil login menggunakan kode SAP mitra dan menerima cookie httpOnly', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          username: sapCode,
          password: customerPassword,
        })

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data.name).toBe('Budi Mitra')
      expect(res.body.data.role).toBe('CUSTOMER')
      expect(res.body.data.partnerCodes).toContain(sapCode)

      // Verify httpOnly cookie
      const rawCookies = res.headers['set-cookie']
      const cookies = Array.isArray(rawCookies) ? rawCookies : rawCookies ? [rawCookies] : []
      expect(cookies.length).toBeGreaterThan(0)
      const sessionCookie = cookies.find((c: string) => c.startsWith('awb_session='))
      expect(sessionCookie).toBeDefined()
      expect(sessionCookie).toMatch(/HttpOnly/i)
      expect(sessionCookie).toMatch(/Path=\//i)
    })

    it('berhasil login menggunakan email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          username: adminUser.email,
          password: adminPassword,
        })

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data.role).toBe('ADMIN')
    })

    it('gagal login dengan password salah (401)', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          username: sapCode,
          password: 'WrongPassword!',
        })

      expect(res.status).toBe(401)
      expect(res.body.error).toMatch(/Username atau password salah/i)
    })

    it('gagal login jika akun dinonaktifkan (403)', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          username: inactiveUser.email,
          password: inactivePassword,
        })

      expect(res.status).toBe(403)
      expect(res.body.error).toMatch(/dinonaktifkan/i)
    })

    it('membatasi percobaan login saat gagal berulang kali (rate limit 429)', async () => {
      const targetUser = customerUser.email
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/api/auth/login')
          .send({ username: targetUser, password: 'BadPassword' })
      }

      // Next attempt after 5 consecutive failures triggers rate limit block (429)
      const lastRes = await request(app)
        .post('/api/auth/login')
        .send({ username: targetUser, password: 'BadPassword' })

      expect(lastRes.status).toBe(429)
      expect(lastRes.body.error).toMatch(/Terlalu banyak percobaan login/i)
    })
  })

  describe('Sesi & Profil Pengguna (GET /api/auth/me)', () => {
    it('menolak akses tanpa sesi (401)', async () => {
      const res = await request(app).get('/api/auth/me')
      expect(res.status).toBe(401)
      expect(res.body.error).toMatch(/Sesi tidak ditemukan/i)
    })

    it('menolak akses dengan cookie sesi palsu / rusak (401)', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Cookie', 'awb_session=forged.session.token')

      expect(res.status).toBe(401)
      expect(res.body.error).toMatch(/Sesi tidak valid/i)
    })

    it('mengembalikan profil pengguna dengan nama, peran dan daftar kode mitra yang terhubung', async () => {
      // Login first to get cookie
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ username: sapCode, password: customerPassword })

      const cookie = loginRes.headers['set-cookie']![0]!

      const meRes = await request(app)
        .get('/api/auth/me')
        .set('Cookie', cookie)

      expect(meRes.status).toBe(200)
      expect(meRes.body.success).toBe(true)
      expect(meRes.body.data.name).toBe('Budi Mitra')
      expect(meRes.body.data.role).toBe('CUSTOMER')
      expect(meRes.body.data.partnerCodes).toEqual([sapCode])
      expect(meRes.body.data.partners[0].code).toBe(sapCode)
    })
  })

  describe('Pemeriksaan Peran (requireRole)', () => {
    it('menolak akses jika peran yang dimiliki salah (403)', async () => {
      // Login as CUSTOMER
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ username: sapCode, password: customerPassword })

      const customerCookie = loginRes.headers['set-cookie']![0]!

      // Try to access ADMIN-only endpoint
      const res = await request(app)
        .get('/api/partner-accounts')
        .set('Cookie', customerCookie)

      expect(res.status).toBe(403)
      expect(res.body.error).toMatch(/Forbidden/i)
    })

    it('mengizinkan akses jika peran sesuai', async () => {
      // Login as ADMIN
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ username: adminUser.email, password: adminPassword })

      const adminCookie = loginRes.headers['set-cookie']![0]!

      const res = await request(app)
        .get('/api/partner-accounts')
        .set('Cookie', adminCookie)

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
    })
  })

  describe('Logout (POST /api/auth/logout)', () => {
    it('menghapus cookie sesi saat logout', async () => {
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ username: adminUser.email, password: adminPassword })

      const cookie = loginRes.headers['set-cookie']![0]!

      const logoutRes = await request(app)
        .post('/api/auth/logout')
        .set('Cookie', cookie)

      expect(logoutRes.status).toBe(200)
      const rawClearCookies = logoutRes.headers['set-cookie']
      const clearCookies = Array.isArray(rawClearCookies) ? rawClearCookies : rawClearCookies ? [rawClearCookies] : []
      expect(clearCookies.length).toBeGreaterThan(0)
      const clearSession = clearCookies.find((c: string) => c.startsWith('awb_session='))
      expect(clearSession).toMatch(/Max-Age=0/i)

      // Subsequent call to /me without valid cookie is rejected
      const meRes = await request(app)
        .get('/api/auth/me')
        .set('Cookie', clearSession!)

      expect(meRes.status).toBe(401)
    })
  })

  describe('Lupa Password & Reset Mandiri (POST /api/auth/forgot-password & /api/auth/reset-password)', () => {
    it('mengirim OTP ke email akun saat meminta forgot password via kode SAP', async () => {
      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ username: sapCode })

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data.message).toMatch(/OTP/i)

      const emails = emailService.getSentEmails()
      expect(emails.length).toBe(1)
      expect(emails[0]!.to).toBe(customerUser.email)
      expect(emails[0]!.subject).toMatch(/OTP/i)
      expect(emails[0]!.text).toMatch(/\d{6}/)

      // Verify OTP is recorded in database with expiration
      const dbUser = await prisma.user.findUnique({ where: { id: customerUser.id } })
      expect(dbUser?.otpCode).toBeDefined()
      expect(dbUser?.otpExpiresAt).toBeDefined()
      expect(new Date(dbUser!.otpExpiresAt!).getTime()).toBeGreaterThan(Date.now())
    })

    it('mengirim OTP ke email akun saat meminta forgot password via email internal', async () => {
      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ username: adminUser.email })

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)

      const emails = emailService.getSentEmails()
      expect(emails.length).toBe(1)
      expect(emails[0]!.to).toBe(adminUser.email)
    })

    it('menolak permintaan forgot password untuk akun yang tidak ada (404)', async () => {
      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ username: 'non_existent_user@kpn.com' })

      expect(res.status).toBe(404)
      expect(res.body.error).toMatch(/tidak ditemukan/i)
    })

    it('menolak reset password jika kode OTP salah (400)', async () => {
      // First request OTP
      await request(app)
        .post('/api/auth/forgot-password')
        .send({ username: sapCode })

      // Submit invalid OTP
      const res = await request(app)
        .post('/api/auth/reset-password')
        .send({
          username: sapCode,
          otp: '000000',
        })

      expect(res.status).toBe(400)
      expect(res.body.error).toMatch(/Kode OTP tidak valid/i)
    })

    it('menolak reset password jika kode OTP telah kedaluwarsa (400)', async () => {
      // Request OTP
      await request(app)
        .post('/api/auth/forgot-password')
        .send({ username: sapCode })

      // Read valid OTP from DB, then artificially expire it in DB
      const dbUser = await prisma.user.findUnique({ where: { id: customerUser.id } })
      const validOtp = dbUser!.otpCode!

      await prisma.user.update({
        where: { id: customerUser.id },
        data: { otpExpiresAt: new Date(Date.now() - 60 * 1000) },
      })

      const res = await request(app)
        .post('/api/auth/reset-password')
        .send({
          username: sapCode,
          otp: validOtp,
        })

      expect(res.status).toBe(400)
      expect(res.body.error).toMatch(/kedaluwarsa/i)
    })

    it('berhasil reset password: password baru dibuat sistem, dikirim ke email, dan bisa dipakai login', async () => {
      // 1. Request OTP
      await request(app)
        .post('/api/auth/forgot-password')
        .send({ username: sapCode })

      const emailsAfterForgot = emailService.getSentEmails()
      const otpMatch = emailsAfterForgot[0]!.text.match(/\b\d{6}\b/)
      expect(otpMatch).not.toBeNull()
      const validOtp = otpMatch![0]!

      emailService.clearSentEmails()

      // 2. Submit valid OTP
      const resetRes = await request(app)
        .post('/api/auth/reset-password')
        .send({
          username: sapCode,
          otp: validOtp,
        })

      expect(resetRes.status).toBe(200)
      expect(resetRes.body.success).toBe(true)

      // 3. Verify OTP is cleared in DB
      const updatedUser = await prisma.user.findUnique({ where: { id: customerUser.id } })
      expect(updatedUser?.otpCode).toBeNull()
      expect(updatedUser?.otpExpiresAt).toBeNull()

      // 4. Verify new password email was sent
      const emailsAfterReset = emailService.getSentEmails()
      expect(emailsAfterReset.length).toBe(1)
      expect(emailsAfterReset[0]!.to).toBe(customerUser.email)
      expect(emailsAfterReset[0]!.subject).toMatch(/Reset Password/i)

      const pwdMatch = emailsAfterReset[0]!.text.match(/Password baru Anda:\s*([^\s]+)/)
      expect(pwdMatch).not.toBeNull()
      const generatedPassword = pwdMatch![1]!
      expect(generatedPassword).not.toBe(customerPassword)

      // 5. Old password no longer works
      const oldLoginRes = await request(app)
        .post('/api/auth/login')
        .send({ username: sapCode, password: customerPassword })
      expect(oldLoginRes.status).toBe(401)

      // 6. New auto-generated password works
      const newLoginRes = await request(app)
        .post('/api/auth/login')
        .send({ username: sapCode, password: generatedPassword })
      expect(newLoginRes.status).toBe(200)
      expect(newLoginRes.body.success).toBe(true)
    })

    it('membatalkan semua sesi lama setelah password di-reset', async () => {
      // 1. Login to get an active session cookie
      // Retrieve current valid password via forgot & reset
      await request(app).post('/api/auth/forgot-password').send({ username: sapCode })
      const otpMatch = emailService.getSentEmails()[0]!.text.match(/\b\d{6}\b/)
      emailService.clearSentEmails()

      await request(app).post('/api/auth/reset-password').send({ username: sapCode, otp: otpMatch![0]! })
      const pwdMatch = emailService.getSentEmails()[0]!.text.match(/Password baru Anda:\s*([^\s]+)/)
      const currentPassword = pwdMatch![1]!
      emailService.clearSentEmails()

      // Log in with current password
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ username: sapCode, password: currentPassword })
      expect(loginRes.status).toBe(200)
      const activeSessionCookie = loginRes.headers['set-cookie']![0]!

      // Confirm session is active
      const beforeResetMe = await request(app)
        .get('/api/auth/me')
        .set('Cookie', activeSessionCookie)
      expect(beforeResetMe.status).toBe(200)

      // 2. Perform another password reset
      await request(app).post('/api/auth/forgot-password').send({ username: sapCode })
      const secondOtpMatch = emailService.getSentEmails()[0]!.text.match(/\b\d{6}\b/)
      emailService.clearSentEmails()

      await request(app).post('/api/auth/reset-password').send({ username: sapCode, otp: secondOtpMatch![0]! })

      // 3. Now previous session cookie must be rejected (401)
      const afterResetMe = await request(app)
        .get('/api/auth/me')
        .set('Cookie', activeSessionCookie)

      expect(afterResetMe.status).toBe(401)
      expect(afterResetMe.body.error).toMatch(/reset password/i)
    })
  })
})
