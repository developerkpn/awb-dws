import { extname } from 'node:path'
import { CustomError } from '@awb/server-core'
import { fileExists, generateStorageKey, getFilePath, saveFile } from '../../helpers/storage'
import documentRepository from './document.repository'

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'application/pdf']
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.pdf']
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB

export default {
  async uploadDocument(file: Express.Multer.File, category: string, uploadedBy: number) {
    if (!file || !file.buffer) {
      throw new CustomError('File wajib diunggah', 400)
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      throw new CustomError('Ukuran file melebihi batas maksimal (5 MB)', 400)
    }

    // Validate MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new CustomError('Format file tidak didukung. Hanya file JPG, PNG, dan PDF yang diizinkan.', 400)
    }

    // Validate extension
    const ext = extname(file.originalname).toLowerCase()
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      throw new CustomError('Format file tidak didukung. Hanya file JPG, PNG, dan PDF yang diizinkan.', 400)
    }

    const cleanCategory = category.toLowerCase().replace(/[^a-z0-9_-]/g, '') || 'document'
    const fileKey = generateStorageKey(cleanCategory, file.originalname)

    // Save file to disk
    await saveFile(fileKey, file.buffer)

    // Save metadata in database
    const document = await documentRepository.createDocument({
      fileKey,
      fileName: file.originalname,
      mimeType: file.mimetype,
      fileSize: file.size,
      category: cleanCategory,
      uploadedBy,
    })

    return {
      id: document.id,
      fileKey: document.fileKey,
      fileName: document.fileName,
      mimeType: document.mimeType,
      fileSize: document.fileSize,
      category: document.category,
      url: `/api/documents/${document.fileKey}`,
      createdAt: document.createdAt,
    }
  },

  async getDocument(fileKey: string, user: { id: number; role: string }) {
    const document = await documentRepository.findDocumentByKey(fileKey)
    if (!document) {
      throw new CustomError('Dokumen tidak ditemukan', 404)
    }

    // Access control: only owner (pemilik pengajuan), Logistik, and Admin
    const isOwner = user.id === document.uploadedBy
    const isPrivileged = user.role === 'ADMIN' || user.role === 'LOGISTIK'

    if (!isOwner && !isPrivileged) {
      throw new CustomError('Akses ditolak: File hanya bisa dibuka oleh pemilik pengajuan, Logistik dan admin', 403)
    }

    if (!fileExists(document.fileKey)) {
      throw new CustomError('File fisik tidak ditemukan di penyimpanan', 404)
    }

    return {
      document,
      filePath: getFilePath(document.fileKey),
    }
  },
}

