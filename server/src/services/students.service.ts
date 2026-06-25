import { prisma } from '../prisma/client'

export const getMe = async (userId: string) => {
  return prisma.student.findUnique({
    where: { userId },
    include: { school: true },
  })
}

export const updateMe = async (userId: string, data: {
  firstName?: string
  lastName?: string
  schoolId?: string
  level?: 'O_LEVEL' | 'A_LEVEL'
  schoolYear?: string
  combination?: string
  interests?: string[]
  profilePhoto?: string
}) => {
  return prisma.student.update({
    where: { userId },
    data,
  })
}

export const getDashboard = async (userId: string) => {
  const student = await prisma.student.findUnique({ where: { userId } })
  if (!student) throw new Error('Student not found')

  const [upcomingSessions, registeredWorkshops, groupSessions, latestConfidence] =
    await Promise.all([
      prisma.session.findMany({
        where: { studentId: student.id, status: 'CONFIRMED', scheduledAt: { gte: new Date() } },
        include: { professional: true },
        orderBy: { scheduledAt: 'asc' },
        take: 3,
      }),
      prisma.workshopRegistration.findMany({
        where: { studentId: student.id },
        include: { workshop: { include: { company: true } } },
        orderBy: { registeredAt: 'desc' },
        take: 3,
      }),
      prisma.groupSessionEnrolment.findMany({
        where: {
          studentId: student.id,
          groupSession: { isCancelled: false, scheduledAt: { gte: new Date() } },
        },
        include: { groupSession: { include: { professional: true } } },
        orderBy: { joinedAt: 'desc' },
        take: 3,
      }),
      prisma.confidenceLog.findFirst({
        where: { studentId: student.id },
        orderBy: { createdAt: 'desc' },
      }),
    ])

  return { upcomingSessions, registeredWorkshops, groupSessions, latestConfidence }
}

export const logConfidence = async (userId: string, score: number, note?: string) => {
  const student = await prisma.student.findUnique({ where: { userId } })
  if (!student) throw new Error('Student not found')

  const log = await prisma.confidenceLog.create({
    data: { studentId: student.id, score, note },
  })

  await prisma.student.update({
    where: { id: student.id },
    data: { confidenceLevel: score },
  })

  return log
}

export const getConfidenceLogs = async (userId: string) => {
  const student = await prisma.student.findUnique({ where: { userId } })
  if (!student) throw new Error('Student not found')

  return prisma.confidenceLog.findMany({
    where: { studentId: student.id },
    orderBy: { createdAt: 'asc' },
  })
}
