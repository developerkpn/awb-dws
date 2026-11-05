import { basename } from 'node:path'
import { CustomError } from '@awb/server-core'
import { detectFileType, getFilePath, removeFile, storeFile } from '../../helpers/storage'
import repository from './document.repository'
import type { SessionUser } from '../auth/auth.schema'

export default {
  async upload(file: Express.Multer.File, category: string, uploadedBy: string) {
    let storedPath = file.path

    try {
      const detected = await detectFileType(file.path)

      if (!detected || detected.mimeType !== file.mimetype) {
        throw new CustomError('Only matching JPEG, PNG or PDF files are accepted', 422)
      }

      const fileKey = await storeFile(file.path, category, detected.extension)
      storedPath = getFilePath(fileKey)

      const document = await repository.create({
        fileKey,
        fileName:
          basename(file.originalname)
            .split('')
            .filter((character) => character.charCodeAt(0) >= 32 && character.charCodeAt(0) !== 127)
            .join('')
            .slice(0, 180) || `document${detected.extension}`,
        mimeType: detected.mimeType,
        fileSize: file.size,
        category,
        uploadedBy,
      })

      return {
        id: document.id,
        fileName: document.fileName,
        mimeType: document.mimeType,
        fileSize: document.fileSize,
        category: document.category,
        url: `/api/documents/${document.id}`,
        createdAt: document.createdAt,
      }
    } catch (error) {
      await removeFile(storedPath)
      throw error
    }
  },

  async read(id: string, user: SessionUser) {
    const document = await repository.findById(id)
    const reviewer = user.role === 'LOGISTIC' && user.permissions.includes('documents:read')

    if (!document || (document.uploadedBy !== user.id && user.role !== 'ADMIN' && !reviewer)) {
      throw new CustomError('Document not found', 404)
    }

    return { document, path: getFilePath(document.fileKey) }
  },
}
