import { Router } from 'express'
import multer from 'multer'
import { CustomError, success } from '@awb/server-core'
import { requireAuth } from '../../middlewares/auth.middleware'
import documentService from './document.service'

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
  },
})

const router = Router()

// Upload file: POST /api/documents/upload
router.post(
  '/upload',
  requireAuth,
  (req, res, next) => {
    upload.single('file')(req, res, (err) => {
      if (err) {
        if ((err as { code?: string }).code === 'LIMIT_FILE_SIZE') {
          return next(new CustomError('Ukuran file melebihi batas maksimal (5 MB)', 400))
        }
        return next(new CustomError(err.message, 400))
      }
      next()
    })
  },
  async (req, res, next) => {
    try {
      if (!req.file) {
        throw new CustomError('File wajib diunggah', 400)
      }

      const category = (req.body?.category as string) || (req.query?.category as string) || 'document'
      const result = await documentService.uploadDocument(req.file, category, req.user!.id)

      res.status(201).json(success(result))
    } catch (err) {
      next(err)
    }
  },
)

// Retrieve file: GET /api/documents/:category/:fileName
router.get('/:category/:fileName', requireAuth, async (req, res, next) => {
  try {
    const fileKey = `${req.params.category}/${req.params.fileName}`
    const { document, filePath } = await documentService.getDocument(fileKey, req.user!)

    res.setHeader('Content-Type', document.mimeType)
    res.setHeader('Content-Disposition', `inline; filename="${document.fileName}"`)
    res.sendFile(filePath)
  } catch (err) {
    next(err)
  }
})

export default router

