import { prisma } from '../prisma/client'
import { COMMISSION_RATE } from './auth.service'
import { createNotification } from './notifications.service'

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

export const create = async (studentUserId: string, data: {
  professionalId: string
  type: 'FREE_INTRO' | 'PRO' | 'PREMIUM'
  scheduledAt: string
  duration: number
}) => {
  const student = await prisma.student.findUnique({ where: { userId: studentUserId } })
  if (!student) throw new Error('Student not found')

  const professional = await prisma.professional.findUnique({
    where: { id: data.professionalId },
  })
  if (!professional) throw new Error('Professional not found')
  if (!professional.isVerified || !professional.isActive || !professional.isMentor) {
    throw new Error('Professional is not available for mentoring.')
  }

  if (data.type === 'FREE_INTRO') {
    const existing = await prisma.session.findFirst({
      where: {
        studentId: student.id,
        professionalId: professional.id,
        type: 'FREE_INTRO',
      },
    })
    if (existing) throw new Error('You have already had a free intro with this professional')
  }

  if (data.type !== 'FREE_INTRO') {
    if (professional.sessionsUsedThisMonth >= professional.sessionQuota) {
      throw new Error('This professional has reached their session limit for this month')
    }
  }

  let grossAmount = 0
  if (data.type === 'PRO') grossAmount = professional.proRate
  if (data.type === 'PREMIUM') grossAmount = Math.round(professional.premiumRate / professional.premiumSessionsPerMonth)

  const commissionAmount = Math.round(grossAmount * COMMISSION_RATE)
  const netAmount = grossAmount - commissionAmount

  return prisma.session.create({
    data: {
      studentId: student.id,
      professionalId: professional.id,
      type: data.type,
      scheduledAt: new Date(data.scheduledAt),
      duration: data.duration,
      grossAmount,
      commissionAmount,
      netAmount,
    },
    include: {
      student: { select: { id: true, firstName: true, lastName: true } },
      professional: { select: { id: true, firstName: true, lastName: true } },
    },
  })
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
  })
  if (studentUser) {
    await createNotification(
      studentUser.id,
      'SESSION_CONFIRMED',
      'Session confirmed',
      'Your session has been confirmed.',
      `/sessions/${id}`
    )
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
  })
  if (studentUser) {
    await createNotification(
      studentUser.id,
      'SESSION_DECLINED',
      'Session declined',
      `Your session request was declined. Reason: ${reason}`,
      '/sessions'
    )
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

  return prisma.session.update({
    where: { id },
    data: { status: 'CANCELLED', cancelReason: reason },
  })
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

export const submitFeedback = async (
  sessionId: string,
  studentUserId: string,
  data: {
    confidenceBefore: number
    confidenceAfter: number
    wasHelpful: boolean
    professionalFeedback?: string
  }
) => {
  const student = await prisma.student.findUnique({ where: { userId: studentUserId } })
  if (!student) throw new Error('Student not found')

  const session = await prisma.session.findUnique({ where: { id: sessionId } })
  if (!session) throw new Error('Session not found')
  if (session.studentId !== student.id) throw new Error('Access denied')
  if (session.status !== 'COMPLETED') throw new Error('Can only submit feedback for completed sessions')

  const existing = await prisma.sessionFeedback.findUnique({ where: { sessionId } })
  if (existing) throw new Error('You have already submitted feedback for this session')

  await prisma.$transaction(async (tx) => {
    await tx.sessionFeedback.create({
      data: {
        sessionId,
        studentId: student.id,
        confidenceBefore: data.confidenceBefore,
        confidenceAfter: data.confidenceAfter,
        wasHelpful: data.wasHelpful,
        professionalFeedback: data.professionalFeedback ?? null,
      },
    })

    await tx.confidenceLog.create({
      data: {
        studentId: student.id,
        score: data.confidenceAfter,
      },
    })

    await tx.student.update({
      where: { id: student.id },
      data: { confidenceLevel: data.confidenceAfter },
    })

    if (data.professionalFeedback?.trim()) {
      const professionalUser = await tx.user.findFirst({
        where: { professional: { id: session.professionalId } },
      })
      if (professionalUser) {
        await tx.notification.create({
          data: {
            userId: professionalUser.id,
            type: 'SESSION_FEEDBACK',
            title: 'New session feedback',
            body: data.professionalFeedback.trim(),
            link: `/sessions/${sessionId}`,
          },
        })
      }
    }
  })

  return { message: 'Feedback submitted' }
}
