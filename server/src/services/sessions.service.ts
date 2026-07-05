import { prisma } from '../prisma/client'
import { COMMISSION_RATE } from './auth.service'
import { createNotification } from './notifications.service'
import * as emailService from './email.service'

export const list = async (userId: string, role: string, filters: {
  status?: string
  type?: string
  page?: number
  limit?: number
}) => {
  const page = filters.page ?? 1
  const limit = filters.limit ?? 20
  const skip = (page - 1) * limit

  let profileId: string
  let whereKey: string

  if (role === 'STUDENT') {
    const student = await prisma.student.findUnique({ where: { userId } })
    if (!student) throw new Error('Student not found')
    profileId = student.id
    whereKey = 'studentId'
  } else {
    const professional = await prisma.professional.findUnique({ where: { userId } })
    if (!professional) throw new Error('Professional not found')
    profileId = professional.id
    whereKey = 'professionalId'
  }

  const where: Record<string, unknown> = { [whereKey]: profileId }
  if (filters.status) where.status = filters.status
  if (filters.type) where.type = filters.type

  const [sessions, total] = await Promise.all([
    prisma.session.findMany({
      where,
      skip,
      take: limit,
      include: {
        student: { select: { id: true, firstName: true, lastName: true } },
        professional: { select: { id: true, firstName: true, lastName: true, jobTitle: true } },
        review: true,
      },
      orderBy: { scheduledAt: 'desc' },
    }),
    prisma.session.count({ where }),
  ])

  return { sessions, total, page, limit }
}

const resolveSlotData = async (data: {
  professionalId?: string
  slotId?: string
  scheduledAt?: string
  duration?: number
}) => {
  if (data.slotId) {
    const slot = await prisma.mentorSlot.findUnique({ where: { id: data.slotId } })
    if (!slot) throw new Error('Slot not found')
    if (slot.isBooked) throw new Error('Slot is already booked')
    return { professionalId: slot.professionalId, scheduledAt: slot.scheduledAt, duration: slot.durationMins }
  }
  if (!data.professionalId || !data.scheduledAt || !data.duration) {
    throw new Error('professionalId, scheduledAt and duration are required')
  }
  return { professionalId: data.professionalId, scheduledAt: new Date(data.scheduledAt), duration: data.duration }
}

const computeGrossAmount = (type: string, professional: { proRate: number; premiumRate: number; premiumSessionsPerMonth: number }) => {
  if (type === 'PRO') return professional.proRate
  if (type === 'PREMIUM') return Math.round(professional.premiumRate / professional.premiumSessionsPerMonth)
  return 0
}

export const create = async (studentUserId: string, data: {
  professionalId?: string
  slotId?: string
  type: 'FREE_INTRO' | 'PRO' | 'PREMIUM'
  scheduledAt?: string
  duration?: number
}) => {
  const student = await prisma.student.findUnique({ where: { userId: studentUserId } })
  if (!student) throw new Error('Student not found')

  const { professionalId, scheduledAt, duration } = await resolveSlotData(data)

  const professional = await prisma.professional.findUnique({
    where: { id: professionalId },
    include: { user: { select: { email: true } } },
  })
  if (!professional) throw new Error('Professional not found')
  if (!professional.isVerified || !professional.isActive) throw new Error('Professional is not available')

  const upcomingBookedCount = await prisma.mentorSlot.count({
    where: { bookedByStudentId: student.id, scheduledAt: { gt: new Date() }, isBooked: true },
  })
  if (upcomingBookedCount >= 3) {
    throw new Error('You already have 3 upcoming mentor sessions. Complete one before booking another.')
  }

  if (data.type === 'FREE_INTRO') {
    const existing = await prisma.session.findFirst({
      where: { studentId: student.id, professionalId: professional.id, type: 'FREE_INTRO' },
    })
    if (existing) throw new Error('You have already had a free intro with this professional')
  } else if (professional.sessionsUsedThisMonth >= professional.sessionQuota) {
    throw new Error('This professional has reached their session limit for this month')
  }

  const grossAmount = computeGrossAmount(data.type, professional)
  const commissionAmount = Math.round(grossAmount * COMMISSION_RATE)

  const session = await prisma.session.create({
    data: {
      studentId: student.id,
      professionalId: professional.id,
      type: data.type,
      scheduledAt,
      duration,
      grossAmount,
      commissionAmount,
      netAmount: grossAmount - commissionAmount,
    },
    include: {
      student: { select: { id: true, firstName: true, lastName: true } },
      professional: { select: { id: true, firstName: true, lastName: true } },
    },
  })

  if (data.slotId) {
    await prisma.mentorSlot.update({
      where: { id: data.slotId },
      data: { isBooked: true, bookedByStudentId: student.id, sessionId: session.id },
    })
  }

  emailService.notifyProfessionalNewSessionRequest(
    { firstName: professional.firstName, email: professional.user.email },
    { firstName: student.firstName, lastName: student.lastName },
    { scheduledAt: session.scheduledAt, type: session.type },
  ).catch(console.error)

  return session
}

export const getOne = async (id: string, userId: string, role: string) => {
  const session = await prisma.session.findUnique({
    where: { id },
    include: {
      student: true,
      professional: true,
      review: true,
    },
  })

  if (!session) throw new Error('Session not found')

  if (role === 'ADMIN') return session

  if (role === 'STUDENT') {
    const student = await prisma.student.findUnique({ where: { userId } })
    if (session.studentId !== student?.id) throw new Error('Access denied')
  }

  if (role === 'PROFESSIONAL') {
    const professional = await prisma.professional.findUnique({ where: { userId } })
    if (session.professionalId !== professional?.id) throw new Error('Access denied')
  }

  return session
}

export const confirm = async (id: string, professionalUserId: string) => {
  const professional = await prisma.professional.findUnique({
    where: { userId: professionalUserId },
  })
  if (!professional) throw new Error('Professional not found')

  const session = await prisma.session.findUnique({ where: { id } })
  if (!session) throw new Error('Session not found')
  if (session.professionalId !== professional.id) throw new Error('Access denied')
  if (session.status !== 'PENDING') throw new Error('Session is not pending')

  const [updated] = await prisma.$transaction([
    prisma.session.update({
      where: { id },
      data: { status: 'CONFIRMED' },
    }),
    prisma.professional.update({
      where: { id: professional.id },
      data: { sessionsUsedThisMonth: { increment: 1 } },
    }),
  ])

  const studentUser = await prisma.user.findFirst({
    where: { student: { id: session.studentId } },
    include: { student: { select: { firstName: true } } },
  })
  if (studentUser) {
    await createNotification(
      studentUser.id,
      'SESSION_CONFIRMED',
      'Session confirmed',
      'Your session has been confirmed.',
      `/sessions/${id}`
    )
    emailService.notifyStudentSessionConfirmed(
      { firstName: studentUser.student!.firstName, email: studentUser.email },
      { firstName: professional.firstName, lastName: professional.lastName },
      { scheduledAt: session.scheduledAt, type: session.type },
    ).catch(console.error)
  }

  return updated
}

export const decline = async (id: string, professionalUserId: string, reason: string) => {
  const professional = await prisma.professional.findUnique({
    where: { userId: professionalUserId },
  })
  if (!professional) throw new Error('Professional not found')

  const session = await prisma.session.findUnique({ where: { id } })
  if (!session) throw new Error('Session not found')
  if (session.professionalId !== professional.id) throw new Error('Access denied')
  if (session.status !== 'PENDING') throw new Error('Session is not pending')

  const updated = await prisma.session.update({
    where: { id },
    data: { status: 'CANCELLED', cancelReason: reason },
  })

  const studentUser = await prisma.user.findFirst({
    where: { student: { id: session.studentId } },
    include: { student: { select: { firstName: true } } },
  })
  if (studentUser) {
    await createNotification(
      studentUser.id,
      'SESSION_DECLINED',
      'Session declined',
      `Your session request was declined. Reason: ${reason}`,
      '/sessions'
    )
    emailService.notifyStudentSessionDeclined(
      { firstName: studentUser.student!.firstName, email: studentUser.email },
      { firstName: professional.firstName, lastName: professional.lastName },
      { scheduledAt: session.scheduledAt },
      reason,
    ).catch(console.error)
  }

  return updated
}

export const cancel = async (id: string, userId: string, role: string, reason: string) => {
  const session = await prisma.session.findUnique({ where: { id } })
  if (!session) throw new Error('Session not found')

  if (role === 'STUDENT') {
    const student = await prisma.student.findUnique({ where: { userId } })
    if (session.studentId !== student?.id) throw new Error('Access denied')
  }

  if (role === 'PROFESSIONAL') {
    const professional = await prisma.professional.findUnique({ where: { userId } })
    if (session.professionalId !== professional?.id) throw new Error('Access denied')
  }

  if (!['PENDING', 'CONFIRMED'].includes(session.status)) {
    throw new Error('Session cannot be cancelled')
  }

  const cancelled = await prisma.session.update({
    where: { id },
    data: { status: 'CANCELLED', cancelReason: reason },
  })

  ;(async () => {
    if (role === 'STUDENT') {
      const [proUser, student] = await Promise.all([
        prisma.user.findFirst({
          where: { professional: { id: session.professionalId } },
          select: { email: true, professional: { select: { firstName: true, lastName: true } } },
        }),
        prisma.student.findUnique({
          where: { id: session.studentId },
          select: { firstName: true, lastName: true },
        }),
      ])
      if (proUser?.professional && student) {
        await emailService.notifyProfessionalSessionCancelled(
          { firstName: proUser.professional.firstName, email: proUser.email },
          { firstName: student.firstName, lastName: student.lastName },
          { scheduledAt: session.scheduledAt },
        )
      }
    } else if (role === 'PROFESSIONAL') {
      const [studentUser, professional] = await Promise.all([
        prisma.user.findFirst({
          where: { student: { id: session.studentId } },
          include: { student: { select: { firstName: true } } },
        }),
        prisma.professional.findUnique({
          where: { id: session.professionalId },
          select: { firstName: true, lastName: true },
        }),
      ])
      if (studentUser?.student && professional) {
        await emailService.notifyStudentSessionCancelled(
          { firstName: studentUser.student.firstName, email: studentUser.email },
          { firstName: professional.firstName, lastName: professional.lastName },
          { scheduledAt: session.scheduledAt },
        )
      }
    }
  })().catch(console.error)

  return cancelled
}

export const complete = async (id: string, professionalUserId: string) => {
  const professional = await prisma.professional.findUnique({
    where: { userId: professionalUserId },
  })
  if (!professional) throw new Error('Professional not found')

  const session = await prisma.session.findUnique({ where: { id } })
  if (!session) throw new Error('Session not found')
  if (session.professionalId !== professional.id) throw new Error('Access denied')
  if (session.status !== 'CONFIRMED') throw new Error('Session is not confirmed')

  const updated = await prisma.session.update({
    where: { id },
    data: { status: 'COMPLETED' },
  })

  const studentUser = await prisma.user.findFirst({
    where: { student: { id: session.studentId } },
  })
  if (studentUser) {
    await createNotification(
      studentUser.id,
      'SESSION_COMPLETED',
      'Session completed',
      'Your session is complete. Leave a review for your professional.',
      `/sessions/${id}`
    )
  }

  return updated
}

export const saveNotes = async (id: string, professionalUserId: string, notes: string) => {
  const professional = await prisma.professional.findUnique({
    where: { userId: professionalUserId },
  })
  if (!professional) throw new Error('Professional not found')

  const session = await prisma.session.findUnique({ where: { id } })
  if (!session) throw new Error('Session not found')
  if (session.professionalId !== professional.id) throw new Error('Access denied')

  return prisma.session.update({ where: { id }, data: { notes } })
}

export const submitReview = async (
  sessionId: string,
  studentUserId: string,
  rating: number,
  comment?: string
) => {
  const student = await prisma.student.findUnique({ where: { userId: studentUserId } })
  if (!student) throw new Error('Student not found')

  const session = await prisma.session.findUnique({ where: { id: sessionId } })
  if (!session) throw new Error('Session not found')
  if (session.studentId !== student.id) throw new Error('Access denied')
  if (session.status !== 'COMPLETED') throw new Error('Can only review completed sessions')

  const existing = await prisma.review.findUnique({ where: { sessionId } })
  if (existing) throw new Error('You have already reviewed this session')

  if (rating < 1 || rating > 5) throw new Error('Rating must be between 1 and 5')

  return prisma.review.create({
    data: {
      sessionId,
      studentId: student.id,
      professionalId: session.professionalId,
      rating,
      comment,
    },
  })
}
