import request from 'supertest'
import { describe, expect, it } from 'vitest'
import app from '../src/app'
import { prisma } from '../src/config/prisma'
import { getFilePath } from '../src/lib/storage'
import { grant, origin, sessionFor } from './helpers'

const png = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j7ioAAAAASUVORK5CYII=',
  'base64',
)

describe('Private streamed document storage', () => {
  it('stores metadata with UUID ownership and only permits the owner or authorized reviewers', async () => {
    const owner = await sessionFor('CUSTOMER')

    await grant(owner.user.roleId, 'documents:create')
    await grant(owner.user.roleId, 'documents:read')
    const other = await sessionFor('CUSTOMER')

    const upload = await request(app)
      .post('/api/documents/upload')
      .set('Origin', origin)
      .set('Cookie', owner.cookie)
      .field('category', 'sim')
      .attach('file', png, {
        filename: 'license.png',
        contentType: 'image/png',
      })

    expect(upload.status).toBe(201)
    expect(upload.body.data).not.toHaveProperty('fileKey')

    const document = await prisma.document.findUniqueOrThrow({
      where: { id: upload.body.data.id },
    })

    expect(document.uploadedBy).toBe(owner.user.id)
    expect(document.fileKey).toMatch(/^sim\/\d{4}\/\d{2}\/\d{2}\/[a-f0-9-]+\.png$/)

    const download = await request(app).get(upload.body.data.url).set('Cookie', owner.cookie)

    expect(download.status).toBe(200)
    expect(download.headers['content-disposition']).toContain('attachment;')

    expect((await request(app).get(upload.body.data.url).set('Cookie', other.cookie)).status).toBe(
      404,
    )

    expect((await request(app).get(upload.body.data.url).set('x-user-role', 'ADMIN')).status).toBe(
      401,
    )

    const reviewer = await sessionFor('LOGISTIC')

    await grant(reviewer.user.roleId, 'documents:read')

    expect(
      (await request(app).get(upload.body.data.url).set('Cookie', reviewer.cookie)).status,
    ).toBe(200)
  })

  it('rejects forged MIME types, oversized files, and invalid categories', async () => {
    const { user, cookie } = await sessionFor('CUSTOMER')

    await grant(user.roleId, 'documents:create')

    const before = await prisma.document.count({
      where: { uploadedBy: user.id },
    })

    for (const file of [Buffer.from('not an image'), Buffer.alloc(5 * 1024 * 1024 + 1)]) {
      const response = await request(app)
        .post('/api/documents/upload')
        .set('Origin', origin)
        .set('Cookie', cookie)
        .field('category', 'sim')
        .attach('file', file, {
          filename: 'fake.png',
          contentType: 'image/png',
        })

      expect(response.status).toBe(422)
    }

    const invalid = await request(app)
      .post('/api/documents/upload')
      .set('Origin', origin)
      .set('Cookie', cookie)
      .field('category', '../../outside')
      .attach('file', png, {
        filename: 'file.png',
        contentType: 'image/png',
      })

    expect(invalid.status).toBe(422)

    expect(
      await prisma.document.count({
        where: { uploadedBy: user.id },
      }),
    ).toBe(before)

    expect(() => getFilePath('../uploads-other/file')).toThrow('Invalid storage key')
  })
})
