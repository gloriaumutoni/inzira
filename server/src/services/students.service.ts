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
  combinationsConsidering?: string[]
  careerInterests?: string[]
  onboardingCompleted?: boolean
}) => {
  return prisma.student.update({
    where: { userId },
    data,
  })
}

export const getDashboard = async (userId: string) => {
  const student = await prisma.student.findUnique({ where: { userId } })
  if (!student) throw new Error('Student not found')

  const [upcomingSessions, groupSessions, confidenceLogEntry] =
    await Promise.all([
      prisma.session.findMany({
        where: { studentId: student.id, status: { in: ['PENDING', 'CONFIRMED'] }, scheduledAt: { gte: new Date() } },
        include: { professional: true },
        orderBy: { scheduledAt: 'asc' },
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

  const latestConfidence = confidenceLogEntry
    ?? (student.confidenceLevel === null
      ? null
      : { id: 'initial', score: student.confidenceLevel, note: null, createdAt: student.createdAt })

  return { upcomingSessions, groupSessions, latestConfidence }
}

export const logConfidence = async (
  userId: string,
  score: number,
  note?: string,
  combination?: string,
  sessionId?: string,
  changedThinking?: boolean | null,
) => {
  const student = await prisma.student.findUnique({ where: { userId } })
  if (!student) throw new Error('Student not found')

  const log = await prisma.confidenceLog.create({
    data: {
      studentId: student.id,
      score,
      note,
      combination: combination ?? null,
      sessionId: sessionId ?? null,
      changedThinking: changedThinking ?? null,
    },
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

export const getPendingReflections = async (userId: string) => {
  const student = await prisma.student.findUnique({
    where: { userId },
    include: { confidenceLogs: { select: { sessionId: true } } },
  })
  if (!student) throw new Error('Student not found')

  const loggedIds = new Set(
    student.confidenceLogs.filter(l => l.sessionId).map(l => l.sessionId!)
  )

  const [completedSessions, enrolments] = await Promise.all([
    prisma.session.findMany({
      where: { studentId: student.id, status: 'COMPLETED' },
      include: { professional: { select: { firstName: true, lastName: true } } },
      orderBy: { scheduledAt: 'desc' },
      take: 20,
    }),
    prisma.groupSessionEnrolment.findMany({
      where: {
        studentId: student.id,
        groupSession: {
          scheduledAt: {
            lte: new Date(),
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
      },
      include: {
        groupSession: {
          select: { id: true, title: true, scheduledAt: true, combinations: true },
        },
      },
    }),
  ])

  const pendingOneOnOne = completedSessions
    .filter(s => !loggedIds.has(s.id))
    .map(s => ({
      sessionId: s.id,
      type: 'ONE_ON_ONE' as const,
      title: `Session with ${s.professional.firstName} ${s.professional.lastName}`,
      scheduledAt: s.scheduledAt.toISOString(),
      combinations: [] as string[],
    }))

  const pendingGroup = enrolments
    .filter(e => !loggedIds.has(e.groupSession.id))
    .map(e => ({
      sessionId: e.groupSession.id,
      type: 'GROUP' as const,
      title: e.groupSession.title,
      scheduledAt: e.groupSession.scheduledAt.toISOString(),
      combinations: e.groupSession.combinations,
    }))

  return { pending: [...pendingOneOnOne, ...pendingGroup] }
}

export const getGroupSessions = async (userId: string) => {
  const student = await prisma.student.findUnique({ where: { userId } })
  if (!student) throw new Error('Student not found')

  return prisma.groupSessionEnrolment.findMany({
    where: { studentId: student.id },
    include: {
      groupSession: {
        include: {
          professional: { select: { id: true, firstName: true, lastName: true, jobTitle: true } },
          _count: { select: { enrolments: true } },
        },
      },
    },
    orderBy: { groupSession: { scheduledAt: 'asc' } },
  })
}
