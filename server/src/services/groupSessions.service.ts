import { prisma } from '../prisma/client'

export const list = async (filters: {
  sector?: string
  combination?: string
  page?: number
  limit?: number
}) => {
  const page = filters.page ?? 1
  const limit = filters.limit ?? 20
  const skip = (page - 1) * limit

  const where: Record<string, unknown> = {
    isCancelled: false,
    scheduledAt: { gte: new Date() },
  }
  if (filters.sector) where.sector = filters.sector
  if (filters.combination) where.combinations = { has: filters.combination }

  const sessions = await prisma.groupSession.findMany({
    where,
    skip,
    take: limit,
    include: {
      professional: {
        select: { id: true, firstName: true, lastName: true, sector: true, profilePhoto: true },
      },
      _count: { select: { enrolments: true } },
    },
    orderBy: { scheduledAt: 'asc' },
  })

  const available = sessions.filter((s) => s._count.enrolments < s.maxStudents)
  const total = available.length

  return {
    sessions: available.map((s) => ({ ...s, currentEnrollment: s._count?.enrolments ?? 0 })),
    total,
    page,
    limit,
  }
}

export const getOwn = async (professionalUserId: string) => {
  const professional = await prisma.professional.findUnique({
    where: { userId: professionalUserId },
  })
  if (!professional) throw new Error('Professional not found')

  const sessions = await prisma.groupSession.findMany({
    where: { professionalId: professional.id },
    include: { _count: { select: { enrolments: true } } },
    orderBy: { scheduledAt: 'desc' },
  })

  return sessions.map((s) => ({
    ...s,
    currentEnrollment: s._count.enrolments,
    slotsLeft: s.maxStudents - s._count.enrolments,
  }))
}

export const getOne = async (id: string) => {
  const session = await prisma.groupSession.findUnique({
    where: { id },
    include: {
      professional: {
        select: { id: true, firstName: true, lastName: true, sector: true },
      },
      _count: { select: { enrolments: true } },
    },
  })
  if (!session) throw new Error('Group session not found')
  return session
}

export const create = async (
  professionalUserId: string,
  data: {
    title: string
    description: string
    sector: string
    combinations?: string[]
    scheduledAt: string
    duration: number
    maxStudents?: number
    isRecurring?: boolean
    recurringDays?: number
    joinLink?: string
  }
) => {
  const professional = await prisma.professional.findUnique({
    where: { userId: professionalUserId },
  })
  if (!professional) throw new Error('Professional not found')
  if (!professional.isVerified) {
    throw new Error('Only verified professionals can create group sessions.')
  }

  const session = await prisma.groupSession.create({
    data: {
      professionalId: professional.id,
      title: data.title,
      description: data.description,
      sector: data.sector,
      combinations: data.combinations ?? [],
      scheduledAt: new Date(data.scheduledAt),
      duration: data.duration,
      maxStudents: data.maxStudents ?? 30,
      isRecurring: data.isRecurring ?? true,
      recurringDays: data.recurringDays ?? 14,
      joinLink: data.joinLink,
    },
  })

  if (session.isRecurring) {
    const nextDate = new Date(session.scheduledAt)
    nextDate.setDate(nextDate.getDate() + session.recurringDays)

    await prisma.groupSession.create({
      data: {
        professionalId: professional.id,
        title: session.title,
        description: session.description,
        sector: session.sector,
        combinations: session.combinations,
        scheduledAt: nextDate,
        duration: session.duration,
        maxStudents: session.maxStudents,
        isRecurring: true,
        recurringDays: session.recurringDays,
        joinLink: session.joinLink,
        parentSessionId: session.id,
      },
    })
  }

  return session
}

export const update = async (
  id: string,
  professionalUserId: string,
  data: {
    title?: string
    description?: string
    scheduledAt?: string
    maxStudents?: number
    joinLink?: string
  }
) => {
  const professional = await prisma.professional.findUnique({
    where: { userId: professionalUserId },
  })
  if (!professional) throw new Error('Professional not found')

  const session = await prisma.groupSession.findUnique({ where: { id } })
  if (!session) throw new Error('Group session not found')
  if (session.professionalId !== professional.id) throw new Error('Access denied')

  return prisma.groupSession.update({
    where: { id },
    data: {
      ...data,
      scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : undefined,
    },
  })
}

export const cancel = async (
  id: string,
  professionalUserId: string,
  scope: 'this' | 'all'
) => {
  const professional = await prisma.professional.findUnique({
    where: { userId: professionalUserId },
  })
  if (!professional) throw new Error('Professional not found')

  const session = await prisma.groupSession.findUnique({ where: { id } })
  if (!session) throw new Error('Group session not found')
  if (session.professionalId !== professional.id) throw new Error('Access denied')

  if (scope === 'all') {
    const parentId = session.parentSessionId ?? session.id
    await prisma.groupSession.updateMany({
      where: {
        OR: [
          { id: parentId },
          { parentSessionId: parentId },
        ],
        scheduledAt: { gte: new Date() },
      },
      data: { isCancelled: true },
    })
  } else {
    await prisma.groupSession.update({
      where: { id },
      data: { isCancelled: true },
    })
  }

  return { cancelled: true, scope }
}

export const enrol = async (groupSessionId: string, studentUserId: string) => {
  const student = await prisma.student.findUnique({ where: { userId: studentUserId } })
  if (!student) throw new Error('Student not found')

  const session = await prisma.groupSession.findUnique({
    where: { id: groupSessionId },
    include: { _count: { select: { enrolments: true } } },
  })
  if (!session) throw new Error('Group session not found')
  if (session.isCancelled) throw new Error('This session has been cancelled')
  if (session.scheduledAt < new Date()) throw new Error('This session has already passed')
  if (session._count.enrolments >= session.maxStudents) {
    throw new Error('This session is full')
  }

  const alreadyEnrolled = await prisma.groupSessionEnrolment.findUnique({
    where: { groupSessionId_studentId: { groupSessionId, studentId: student.id } },
  })
  if (alreadyEnrolled) throw new Error('You are already enrolled in this session')

  const upcomingEnrolments = await prisma.groupSessionEnrolment.count({
    where: {
      studentId: student.id,
      groupSession: { isCancelled: false, scheduledAt: { gte: new Date() } },
    },
  })
  if (upcomingEnrolments >= 3) {
    throw new Error('You can only be enrolled in 3 upcoming group sessions at a time')
  }

  return prisma.groupSessionEnrolment.create({
    data: { groupSessionId, studentId: student.id },
  })
}

export const leave = async (groupSessionId: string, studentUserId: string) => {
  const student = await prisma.student.findUnique({ where: { userId: studentUserId } })
  if (!student) throw new Error('Student not found')

  return prisma.groupSessionEnrolment.delete({
    where: { groupSessionId_studentId: { groupSessionId, studentId: student.id } },
  })
}

export const getRoster = async (id: string, requestingUserId: string, role: string) => {
  if (role === 'PROFESSIONAL') {
    const professional = await prisma.professional.findUnique({
      where: { userId: requestingUserId },
    })
    const session = await prisma.groupSession.findUnique({ where: { id } })
    if (session?.professionalId !== professional?.id) throw new Error('Access denied')
  }

  const enrolments = await prisma.groupSessionEnrolment.findMany({
    where: { groupSessionId: id },
    include: {
      student: { include: { school: true } },
    },
  })

  return enrolments.map((e) => ({
    code: `S${e.student.id.slice(0, 6).toUpperCase()}`,
    school: e.student.school?.name ?? 'Unknown',
    level: e.student.level,
    joinedAt: e.joinedAt,
  }))
}
