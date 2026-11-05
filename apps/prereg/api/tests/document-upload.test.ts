import request from 'supertest'
import { beforeAll, describe, expect, it } from 'vitest'
import app from '../src/app'
import { prisma } from '../src/config/prisma'
import { hashPassword } from '../src/helpers/password'
import { fileExists, getFilePath } from '../src/helpers/storage'
import partnerAccountRepository from '../src/modules/partner-account/partner-account.repository'

describe('Document Upload & Role-Based Access Control (AWB-11)', () => {
  const runId = Date.now()
  let uploaderCookie: string
  let otherVendorCookie: string
  let logistikCookie: string
  let adminCookie: string

  let uploaderUser: { id: number; email: string }
  let otherVendorUser: { id: number; email: string }
  let logistikUser: { id: number; email: string }
  let adminUser: { id: number; email: string }

  beforeAll(async () => {
    // 1. Create Uploader User (Vendor A)
    const partnerA = await partnerAccountRepository.upsertPartnerMaster({
      code: `LIFNR-DOC-A-${runId}`,
      name: 'PT Vendor Trans A',
      role: 'VENDOR',
    })
    uploaderUser = await partnerAccountRepository.createUserWithPartners({
      name: 'Vendor A Uploader',
      email: `uploader_${runId}@vendor.com`,
      phone: '081211112222',
      role: 'VENDOR',
      passwordHash: hashPassword('VendorPass123!'),
      partnerIds: [partnerA.id],
    })
    const loginResA = await request(app)
      .post('/api/auth/login')
      .send({ username: `LIFNR-DOC-A-${runId}`, password: 'VendorPass123!' })
    uploaderCookie = loginResA.headers['set-cookie']![0]!

    // 2. Create Another Vendor (Vendor B)
    const partnerB = await partnerAccountRepository.upsertPartnerMaster({
      code: `LIFNR-DOC-B-${runId}`,
      name: 'PT Vendor Trans B',
      role: 'VENDOR',
    })
    otherVendorUser = await partnerAccountRepository.createUserWithPartners({
      name: 'Vendor B Unauthorized',
      email: `other_${runId}@vendor.com`,
      phone: '081233334444',
      role: 'VENDOR',
      passwordHash: hashPassword('VendorPass123!'),
      partnerIds: [partnerB.id],
    })
    const loginResB = await request(app)
      .post('/api/auth/login')
      .send({ username: `LIFNR-DOC-B-${runId}`, password: 'VendorPass123!' })
    otherVendorCookie = loginResB.headers['set-cookie']![0]!

    // 3. Create Logistik Officer
    logistikUser = await partnerAccountRepository.createUserWithPartners({
      name: 'Logistik HO Staff',
      email: `logistik_doc_${runId}@kpn.com`,
      phone: '081255556666',
      role: 'LOGISTIK',
      passwordHash: hashPassword('LogistikPass123!'),
      partnerIds: [],
    })
    const loginResLogistik = await request(app)
      .post('/api/auth/login')
      .send({ username: `logistik_doc_${runId}@kpn.com`, password: 'LogistikPass123!' })
    logistikCookie = loginResLogistik.headers['set-cookie']![0]!

    // 4. Create Admin
    adminUser = await partnerAccountRepository.createUserWithPartners({
      name: 'Super Administrator',
      email: `admin_doc_${runId}@kpn.com`,
      phone: '081277778888',
      role: 'ADMIN',
      passwordHash: hashPassword('AdminPass123!'),
      partnerIds: [],
    })
    const loginResAdmin = await request(app)
      .post('/api/auth/login')
      .send({ username: `admin_doc_${runId}@kpn.com`, password: 'AdminPass123!' })
    adminCookie = loginResAdmin.headers['set-cookie']![0]!
  })

  describe('API Upload File & Validasi (POST /api/documents/upload)', () => {
    it('berhasil mengunggah foto SIM (JPG) dengan kategori sim', async () => {
      const buffer = Buffer.from('fake-jpeg-content-for-sim')
      const res = await request(app)
        .post('/api/documents/upload')
        .set('Cookie', uploaderCookie)
        .field('category', 'sim')
        .attach('file', buffer, { filename: 'sim-joko.jpg', contentType: 'image/jpeg' })

      expect(res.status).toBe(201)
      expect(res.body.success).toBe(true)
      expect(res.body.data.category).toBe('sim')
      expect(res.body.data.fileKey).toMatch(/^sim\/\d+-[a-f0-9]+\.jpg$/)
      expect(res.body.data.fileName).toBe('sim-joko.jpg')
      expect(res.body.data.mimeType).toBe('image/jpeg')

      // Verify file is stored on disk outside database
      expect(fileExists(res.body.data.fileKey)).toBe(true)

      // Verify metadata is stored in database
      const dbDoc = await prisma.document.findUnique({
        where: { fileKey: res.body.data.fileKey },
      })
      expect(dbDoc).toBeDefined()
      expect(dbDoc?.uploadedBy).toBe(uploaderUser.id)
      expect(dbDoc?.fileSize).toBe(buffer.length)
    })

    it('berhasil mengunggah foto supir (PNG) dengan kategori driver', async () => {
      const buffer = Buffer.from('fake-png-content-for-driver')
      const res = await request(app)
        .post('/api/documents/upload')
        .set('Cookie', uploaderCookie)
        .field('category', 'driver')
        .attach('file', buffer, { filename: 'foto-supir.png', contentType: 'image/png' })

      expect(res.status).toBe(201)
      expect(res.body.success).toBe(true)
      expect(res.body.data.category).toBe('driver')
      expect(res.body.data.fileKey).toMatch(/^driver\/\d+-[a-f0-9]+\.png$/)
      expect(fileExists(res.body.data.fileKey)).toBe(true)
    })

    it('berhasil mengunggah dokumen STNK (PDF) dengan kategori stnk', async () => {
      const buffer = Buffer.from('%PDF-1.4 fake pdf data for stnk')
      const res = await request(app)
        .post('/api/documents/upload')
        .set('Cookie', uploaderCookie)
        .field('category', 'stnk')
        .attach('file', buffer, { filename: 'stnk-truk.pdf', contentType: 'application/pdf' })

      expect(res.status).toBe(201)
      expect(res.body.success).toBe(true)
      expect(res.body.data.category).toBe('stnk')
      expect(res.body.data.fileKey).toMatch(/^stnk\/\d+-[a-f0-9]+\.pdf$/)
      expect(fileExists(res.body.data.fileKey)).toBe(true)
    })

    it('menolak file dengan format yang tidak diizinkan (.txt, .exe, .zip) (400)', async () => {
      const buffer = Buffer.from('malicious or invalid script content')
      const res = await request(app)
        .post('/api/documents/upload')
        .set('Cookie', uploaderCookie)
        .field('category', 'sim')
        .attach('file', buffer, { filename: 'virus.exe', contentType: 'application/x-msdownload' })

      expect(res.status).toBe(400)
      expect(res.body.error).toMatch(/tidak didukung/i)
    })

    it('menolak file yang melebihi batas ukuran maksimal 5 MB (400)', async () => {
      // 5 MB + 1024 bytes
      const largeBuffer = Buffer.alloc(5 * 1024 * 1024 + 1024)
      const res = await request(app)
        .post('/api/documents/upload')
        .set('Cookie', uploaderCookie)
        .field('category', 'sim')
        .attach('file', largeBuffer, { filename: 'large-sim.jpg', contentType: 'image/jpeg' })

      expect(res.status).toBe(400)
      expect(res.body.error).toMatch(/melebihi batas maksimal/i)
    })

    it('menolak upload tanpa sesi otentikasi (401)', async () => {
      const buffer = Buffer.from('unauthenticated data')
      const res = await request(app)
        .post('/api/documents/upload')
        .attach('file', buffer, { filename: 'sim.jpg', contentType: 'image/jpeg' })

      expect(res.status).toBe(401)
    })
  })

  describe('Akses File & Pembatasan Sesuai Peran (GET /api/documents/:category/:fileName)', () => {
    let uploadedFileKey: string

    beforeAll(async () => {
      // Upload a test SIM photo by Vendor A
      const buffer = Buffer.from('secret-sim-photo-content-vendor-a')
      const res = await request(app)
        .post('/api/documents/upload')
        .set('Cookie', uploaderCookie)
        .field('category', 'sim')
        .attach('file', buffer, { filename: 'sim-private-joko.jpg', contentType: 'image/jpeg' })

      uploadedFileKey = res.body.data.fileKey
    })

    it('mengizinkan pemilik pengajuan (uploader) membuka file miliknya sendiri (200)', async () => {
      const res = await request(app)
        .get(`/api/documents/${uploadedFileKey}`)
        .set('Cookie', uploaderCookie)

      expect(res.status).toBe(200)
      expect(res.headers['content-type']).toMatch(/image\/jpeg/i)
      expect(res.body.toString()).toBe('secret-sim-photo-content-vendor-a')
    })

    it('mengizinkan petugas Logistik membuka file pengajuan untuk proses verifikasi (200)', async () => {
      const res = await request(app)
        .get(`/api/documents/${uploadedFileKey}`)
        .set('Cookie', logistikCookie)

      expect(res.status).toBe(200)
      expect(res.headers['content-type']).toMatch(/image\/jpeg/i)
      expect(res.body.toString()).toBe('secret-sim-photo-content-vendor-a')
    })

    it('mengizinkan Admin membuka file pengajuan (200)', async () => {
      const res = await request(app)
        .get(`/api/documents/${uploadedFileKey}`)
        .set('Cookie', adminCookie)

      expect(res.status).toBe(200)
      expect(res.headers['content-type']).toMatch(/image\/jpeg/i)
    })

    it('menolak pengguna lain (vendor lain) yang mencoba membuka file orang lain (403)', async () => {
      const res = await request(app)
        .get(`/api/documents/${uploadedFileKey}`)
        .set('Cookie', otherVendorCookie)

      expect(res.status).toBe(403)
      expect(res.body.error).toMatch(/Akses ditolak.*pemilik pengajuan, Logistik dan admin/i)
    })

    it('menolak akses tanpa sesi / cookie (401)', async () => {
      const res = await request(app).get(`/api/documents/${uploadedFileKey}`)
      expect(res.status).toBe(401)
    })

    it('mengembalikan 404 jika file key tidak ditemukan di database', async () => {
      const res = await request(app)
        .get('/api/documents/sim/non-existent-key.jpg')
        .set('Cookie', logistikCookie)

      expect(res.status).toBe(404)
      expect(res.body.error).toMatch(/tidak ditemukan/i)
    })
  })
})
