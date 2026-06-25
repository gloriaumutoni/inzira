import { prisma } from '../prisma/client'

export const createNotification = async (
  userId: string,
  type: string,
  title: string,
  body: string,
  link?: string
) => {
  return prisma.notification.create({
    data: { userId, type, title, body, link },
  })
}

export const list = async (userId: string) => {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })
}

export const markRead = async (id: string, userId: string) => {
  return prisma.notification.updateMany({
    where: { id, userId },
    data: { isRead: true },
  })
}

export const markAllRead = async (userId: string) => {
  return prisma.notification.updateMany({
    where: { userId },
    data: { isRead: true },
  })
}
