import request from 'supertest'
import { beforeAll, describe, expect, it } from 'vitest'
import app from '../src/app'
import { emailService } from '../src/helpers/email'
import partnerAccountRepository from '../src/modules/partner-account/partner-account.repository'

describe('Partner Account Management (AWB-3)', () => {
  const runId = Date.now()
  const kunnr1 = `KUNNR-${runId}-1`
  const kunnr2 = `KUNNR-${runId}-2`
  const lifnr1 = `LIFNR-${runId}-1`
  const intr1 = `INTR-${runId}-1`

  beforeAll(async () => {
    // Seed master partners with unique codes for testing
    await partnerAccountRepository.upsertPartnerMaster({
      code: kunnr1,
      name: 'PT Customer Utama Mandiri',
      role: 'CUSTOMER',
    })
    await partnerAccountRepository.upsertPartnerMaster({
      code: kunnr2,
      name: 'PT Customer Sekunder Jaya',
      role: 'CUSTOMER',
    })
    await partnerAccountRepository.upsertPartnerMaster({
      code: lifnr1,
      name: 'CV Vendor Sawit Makmur',
      role: 'VENDOR',
    })
    await partnerAccountRepository.upsertPartnerMaster({
      code: intr1,
      name: 'KPN Plant Wilayah Riau',
      role: 'INTERCO',
    })
  })

  describe('Daftar Mitra SAP (GET /api/partners)', () => {
    it('mengambil daftar mitra berdasarkan peran CUSTOMER', async () => {
      const res = await request(app).get('/api/partners?role=CUSTOMER')
      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(Array.isArray(res.body.data)).toBe(true)
      const codes = res.body.data.map((p: { code: string }) => p.code)
      expect(codes).toContain(kunnr1)
      expect(codes).not.toContain(lifnr1)
    })
  })

  describe('Pembuatan Akun Mitra oleh Admin (POST /api/partner-accounts)', () => {
    it('menolak pembuatan akun jika bukan ADMIN', async () => {
      const res = await request(app)
        .post('/api/partner-accounts')
        .send({
          role: 'CUSTOMER',
          sapCodes: [kunnr1],
          name: 'Budi Santoso',
          email: `budi_${runId}@example.com`,
          phone: '08123456789',
        })

      expect(res.status).toBe(403)
      expect(res.body.error).toMatch(/Forbidden/)
    })

    it('berhasil membuat akun mitra CUSTOMER oleh ADMIN dan mengirim email credentials', async () => {
      emailService.clearSentEmails()
      const email = `customer_${runId}@mitra.com`

      const res = await request(app)
        .post('/api/partner-accounts')
        .set('x-user-role', 'ADMIN')
        .send({
          role: 'CUSTOMER',
          sapCodes: [kunnr1],
          name: 'Budi Customer',
          email,
          phone: '081298765432',
        })

      expect(res.status).toBe(201)
      expect(res.body.success).toBe(true)
      expect(res.body.data.email).toBe(email)
      expect(res.body.data.role).toBe('CUSTOMER')
      expect(res.body.data.isActive).toBe(true)
      expect(res.body.data.partners).toHaveLength(1)
      expect(res.body.data.partners[0].code).toBe(kunnr1)
      expect(res.body.data).not.toHaveProperty('password')
      expect(res.body.data).not.toHaveProperty('passwordHash')

      // Verify email was sent
      const sent = emailService.getSentEmails()
      expect(sent).toHaveLength(1)
      expect(sent[0]!.to).toBe(email)
      expect(sent[0]!.text).toContain(email)
    })

    it('gagal membuat akun jika kode SAP sudah dipakai akun lain (kode ganda)', async () => {
      const res = await request(app)
        .post('/api/partner-accounts')
        .set('x-user-role', 'ADMIN')
        .send({
          role: 'CUSTOMER',
          sapCodes: [kunnr1],
          name: 'Joko Duplicate',
          email: `joko_${runId}@mitra.com`,
          phone: '081211112222',
        })

      expect(res.status).toBe(422)
      expect(res.body.details).toHaveProperty('sapCodes')
      expect(res.body.details.sapCodes[0]).toMatch(/sudah digunakan/)
    })

    it('gagal membuat akun jika kode SAP tidak cocok dengan perannya', async () => {
      const res = await request(app)
        .post('/api/partner-accounts')
        .set('x-user-role', 'ADMIN')
        .send({
          role: 'CUSTOMER',
          sapCodes: [lifnr1], // LIFNR is VENDOR, not CUSTOMER
          name: 'Mismatch Role',
          email: `mismatch_${runId}@mitra.com`,
          phone: '081233334444',
        })

      expect(res.status).toBe(422)
      expect(res.body.details).toHaveProperty('sapCodes')
      expect(res.body.details.sapCodes[0]).toMatch(/tidak sesuai dengan peran/)
    })
  })

  describe('Nonaktifkan Akun & Reset Password oleh Admin', () => {
    it('bisa menonaktifkan akun mitra dan mengaktifkannya kembali', async () => {
      const email = `vendor_${runId}@mitra.com`

      const createRes = await request(app)
        .post('/api/partner-accounts')
        .set('x-user-role', 'ADMIN')
        .send({
          role: 'VENDOR',
          sapCodes: [lifnr1],
          name: 'Vendor Mandiri',
          email,
          phone: '081277778888',
        })
      expect(createRes.status).toBe(201)
      const userId = createRes.body.data.id

      // Nonaktifkan akun
      const deactRes = await request(app)
        .patch(`/api/partner-accounts/${userId}/status`)
        .set('x-user-role', 'ADMIN')
        .send({ isActive: false })

      expect(deactRes.status).toBe(200)
      expect(deactRes.body.data.isActive).toBe(false)

      // Aktifkan kembali akun
      const reactRes = await request(app)
        .patch(`/api/partner-accounts/${userId}/status`)
        .set('x-user-role', 'ADMIN')
        .send({ isActive: true })

      expect(reactRes.status).toBe(200)
      expect(reactRes.body.data.isActive).toBe(true)
    })

    it('bisa me-reset password dan mengirimkan password baru ke email mitra', async () => {
      emailService.clearSentEmails()
      const email = `interco_${runId}@kpn.com`

      const createRes = await request(app)
        .post('/api/partner-accounts')
        .set('x-user-role', 'ADMIN')
        .send({
          role: 'INTERCO',
          sapCodes: [intr1],
          name: 'Interco Unit',
          email,
          phone: '081299990000',
        })
      expect(createRes.status).toBe(201)
      const userId = createRes.body.data.id

      emailService.clearSentEmails()

      // Reset password
      const resetRes = await request(app)
        .post(`/api/partner-accounts/${userId}/reset-password`)
        .set('x-user-role', 'ADMIN')

      expect(resetRes.status).toBe(200)
      expect(resetRes.body.success).toBe(true)

      // Verify reset email was sent
      const sent = emailService.getSentEmails()
      expect(sent).toHaveLength(1)
      expect(sent[0]!.to).toBe(email)
      expect(sent[0]!.subject).toContain('Reset Password')
    })
  })
})
