import { prisma } from '../../config/prisma'

export default {
  async createDocument(data: {
    fileKey: string
    fileName: string
    mimeType: string
    fileSize: number
    category: string
    uploadedBy: number
  }) {
    return prisma.document.create({
      data,
    })
  },

  async findDocumentByKey(fileKey: string) {
    return prisma.document.findUnique({
      where: { fileKey },
      include: {
        uploader: true,
      },
    })
  },

  async findDocumentById(id: number) {
    return prisma.document.findUnique({
      where: { id },
      include: {
        uploader: true,
      },
    })
  },
}

