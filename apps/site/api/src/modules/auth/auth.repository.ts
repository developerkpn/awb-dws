import { prisma } from '../../config/prisma'

export default {
  findUser(username: string) {
    return prisma.user.findUnique({
      where: { username },
    })
  },
  createSession(userId: string, tokenHash: string, expiresAt: Date) {
    return prisma.authSession.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
      },
    })
  },
  findSession(tokenHash: string) {
    return prisma.authSession.findUnique({
      where: { tokenHash },
      include: { user: true },
    })
  },
  touch(id: string) {
    return prisma.authSession.updateMany({
      where: { id },
      data: {
        lastSeenAt: new Date(),
      },
    })
  },
  removeSession(tokenHash: string) {
    return prisma.authSession.deleteMany({
      where: { tokenHash },
    })
  },
}
