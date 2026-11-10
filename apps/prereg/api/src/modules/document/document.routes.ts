import { randomUUID } from 'node:crypto'
import { Router } from 'express'
import multer from 'multer'
import { z } from 'zod'
import { CustomError, success } from '@awb/server-core'
import { currentUser, requirePermission } from '../../middlewares/auth'
import { incomingDirectory, prepareIncoming, removeFile } from '../../lib/storage'
import authService from '../auth/auth.service'
import service from './document.service'

const categories = z.enum(['sim', 'driver', 'stnk'])

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, callback) => {
      prepareIncoming()
        .then(() => callback(null, incomingDirectory))
        .catch((error) => callback(error, incomingDirectory))
    },
    filename: (_req, _file, callback) => callback(null, randomUUID()),
  }),
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1,
    fields: 1,
    fieldSize: 100,
    parts: 2,
  },
})

const router = Router()

router.post(
  '/upload',
  requirePermission('documents:create'),
  async (req, _res, next) => {
    await authService.throttle(`upload:${currentUser(req).id}`, 100)
    next()
  },
  (req, res, next) => {
    upload.single('file')(req, res, (error) => {
      if (error) {
        next(
          new CustomError(
            error.code === 'LIMIT_FILE_SIZE' ? 'Maximum file size is 5 MB' : 'Invalid upload',
            422,
          ),
        )

        return
      }

      next()
    })
  },
  async (req, res) => {
    if (!req.file) throw new CustomError('Choose a file to upload', 422)

    const parsed = categories.safeParse(req.body?.category)

    if (!parsed.success) {
      await removeFile(req.file.path)
      throw new CustomError('Category must be sim, driver or stnk', 422)
    }

    res.status(201).json(success(await service.upload(req.file, parsed.data, currentUser(req).id)))
  },
)

router.get('/:id', requirePermission('documents:read'), async (req, res, next) => {
  const id = z.uuid().parse(req.params.id)
  const result = await service.read(id, currentUser(req))

  res.setHeader('Cache-Control', 'private, no-store')
  res.setHeader('Content-Type', result.document.mimeType)

  res.setHeader(
    'Content-Disposition',
    `attachment; filename*=UTF-8''${encodeURIComponent(result.document.fileName)}`,
  )

  res.sendFile(result.path, { dotfiles: 'allow' }, (error) => {
    if (error) next(new CustomError('Document unavailable', 404))
  })
})

export default router
