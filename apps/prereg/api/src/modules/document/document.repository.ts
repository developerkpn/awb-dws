import { prisma } from '../../config/prisma'

export default {
  create(data: {
    fileKey: string
    fileName: string
    mimeType: string
    fileSize: number
    category: string
    uploadedBy: string
  }) {
    return prisma.document.create({ data })
  },

  findById(id: string) {
    return prisma.document.findUnique({
      where: { id },
    })
  },
}
