import { prisma } from '../prisma/client'
import * as emailService from './email.service'
import { combinationToStream } from '../utils/streamMap'

const isValidGoogleMeetLink = (url: string): boolean => {
  try {
    return new URL(url).hostname === 'meet.google.com'
  } catch {
    return false
  }
}

export const list = async (filters: {
  sector?: string
  sectors?: string
  combination?: string
  professionalId?: string
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
  if (filters.sectors) {
    const list = filters.sectors.split(',').map(s => s.trim()).filter(Boolean)
    if (list.length > 0) where.sector = { in: list }
  }
  if (filters.combination) {
    const combos = filters.combination.split(',').map(c => c.trim()).filter(Boolean)
    if (combos.length > 0) {
      // Untagged sessions (no combination/pathway set) are meant for all students,
      // so they must still show up under any combination filter.
      where.OR = [
        { combinations: combos.length > 1 ? { hasSome: combos } : { has: combos[0] } },
        { combinations: { isEmpty: true } },
      ]
    }
  }
  if (filters.professionalId) where.professionalId = filters.professionalId

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
    streamCodes?: string[]
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
  if (!data.joinLink?.trim() || !isValidGoogleMeetLink(data.joinLink)) {
    throw new Error('A valid Google Meet link is required.')
  }

  // Stream is the primary tag; derive it from legacy combinations when not supplied.
  const combinations = data.combinations ?? []
  const streamCodes = data.streamCodes && data.streamCodes.length > 0
    ? data.streamCodes
    : ([...new Set(combinations.map((c) => combinationToStream(c)).filter(Boolean))] as string[])

  const session = await prisma.groupSession.create({
    data: {
      professionalId: professional.id,
      title: data.title,
      description: data.description,
      sector: data.sector,
      streamCodes,
      combinations,
      scheduledAt: new Date(data.scheduledAt),
      duration: data.duration,
      maxStudents: data.maxStudents ?? 30,
      isRecurring: data.isRecurring ?? false,
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
        streamCodes: session.streamCodes,
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
  if (data.joinLink !== undefined && (!data.joinLink.trim() || !isValidGoogleMeetLink(data.joinLink))) {
    throw new Error('A valid Google Meet link is required.')
  }

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

  let affectedSessions: { id: string; title: string; scheduledAt: Date }[]

  if (scope === 'all') {
    const parentId = session.parentSessionId ?? session.id
    affectedSessions = await prisma.groupSession.findMany({
      where: {
        OR: [{ id: parentId }, { parentSessionId: parentId }],
        scheduledAt: { gte: new Date() },
        isCancelled: false,
      },
      select: { id: true, title: true, scheduledAt: true },
    })
    await prisma.groupSession.updateMany({
      where: {
        OR: [{ id: parentId }, { parentSessionId: parentId }],
        scheduledAt: { gte: new Date() },
      },
      data: { isCancelled: true },
    })
  } else {
    affectedSessions = [{ id: session.id, title: session.title, scheduledAt: session.scheduledAt }]
    await prisma.groupSession.update({
      where: { id },
      data: { isCancelled: true },
    })
  }

  ;(async () => {
    for (const gs of affectedSessions) {
      const enrolments = await prisma.groupSessionEnrolment.findMany({
        where: { groupSessionId: gs.id },
        include: {
          student: { include: { user: { select: { email: true } } } },
        },
      })
      for (const e of enrolments) {
        await emailService.notifyStudentGroupSessionCancelled(
          { firstName: e.student.firstName, email: e.student.user.email },
          { title: gs.title, scheduledAt: gs.scheduledAt },
        )
      }
    }
  })().catch(console.error)

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

  const enrolment = await prisma.groupSessionEnrolment.create({
    data: { groupSessionId, studentId: student.id },
  })

  ;(async () => {
    const [studentUser, professional, newCount] = await Promise.all([
      prisma.user.findUnique({ where: { id: student.userId }, select: { email: true } }),
      prisma.professional.findUnique({
        where: { id: session.professionalId },
        include: { user: { select: { email: true } } },
      }),
      prisma.groupSessionEnrolment.count({ where: { groupSessionId } }),
    ])

    if (studentUser) {
      await emailService.notifyStudentGroupEnrolmentConfirmed(
        { firstName: student.firstName, email: studentUser.email },
        { title: session.title, scheduledAt: session.scheduledAt, joinLink: session.joinLink },
      )
    }

    if (professional?.user && newCount >= session.maxStudents) {
      await emailService.notifyProfessionalGroupSessionFull(
        { firstName: professional.firstName, email: professional.user.email },
        { title: session.title, scheduledAt: session.scheduledAt },
      )
    }
  })().catch(console.error)

  return enrolment
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
