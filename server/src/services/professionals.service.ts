import { prisma } from '../prisma/client'
import { expandWeeklyTemplate } from '../utils/slots'

export const getMe = async (userId: string) => {
  return prisma.professional.findUnique({
    where: { userId },
    include: { availability: true },
  })
}

export const updateMe = async (userId: string, data: {
  firstName?: string
  lastName?: string
  jobTitle?: string
  employer?: string
  sector?: string
  linkedinUrl?: string
  bio?: string
  profilePhoto?: string
  relevantCombinations?: string[]
}) => {
  return prisma.professional.update({
    where: { userId },
    data,
  })
}

export const updateTiers = async (userId: string, data: {
  offersFreeIntro?: boolean
  offersProTier?: boolean
  offersPremiumTier?: boolean
  proRate?: number
  premiumRate?: number
  premiumSessionsPerMonth?: number
}) => {
  return prisma.professional.update({
    where: { userId },
    data,
  })
}

export const getAvailability = async (userId: string) => {
  const professional = await prisma.professional.findUnique({ where: { userId } })
  if (!professional) throw new Error('Professional not found')

  return prisma.availability.findMany({
    where: { professionalId: professional.id },
    orderBy: [{ dayOfWeek: 'asc' }, { startHour: 'asc' }],
  })
}

export const saveAvailability = async (
  userId: string,
  slots: { dayOfWeek: number; startHour: number; isPremiumOnly: boolean }[]
) => {
  const professional = await prisma.professional.findUnique({ where: { userId } })
  if (!professional) throw new Error('Professional not found')

  await prisma.availability.deleteMany({ where: { professionalId: professional.id } })

  return prisma.availability.createMany({
    data: slots.map((s) => ({ ...s, professionalId: professional.id })),
  })
}

export const getDashboard = async (userId: string) => {
  const professional = await prisma.professional.findUnique({ where: { userId } })
  if (!professional) throw new Error('Professional not found')

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const [pendingRequests, upcomingSessions, activePremiumStudents, monthlyEarnings, completedCount] =
    await Promise.all([
      prisma.session.findMany({
        where: { professionalId: professional.id, status: 'PENDING' },
        include: { student: true },
        take: 3,
      }),
      prisma.session.findMany({
        where: {
          professionalId: professional.id,
          status: 'CONFIRMED',
          scheduledAt: { gte: now },
        },
        include: { student: true },
        orderBy: { scheduledAt: 'asc' },
        take: 3,
      }),
      prisma.mentorship.count({
        where: { professionalId: professional.id, status: 'ACTIVE' },
      }),
      prisma.session.aggregate({
        where: {
          professionalId: professional.id,
          status: 'COMPLETED',
          createdAt: { gte: startOfMonth },
        },
        _sum: { netAmount: true },
      }),
      prisma.session.count({
        where: { professionalId: professional.id, status: 'COMPLETED' },
      }),
    ])

  return {
    pendingRequests,
    upcomingSessions,
    activePremiumStudents,
    monthlyEarnings: monthlyEarnings._sum.netAmount ?? 0,
    sessionsCompleted: completedCount,
    sessionsUsedThisMonth: professional.sessionsUsedThisMonth,
    sessionQuota: professional.sessionQuota,
  }
}

export const getQuota = async (userId: string) => {
  const professional = await prisma.professional.findUnique({ where: { userId } })
  if (!professional) throw new Error('Professional not found')

  return {
    used: professional.sessionsUsedThisMonth,
    total: professional.sessionQuota,
    remaining: professional.sessionQuota - professional.sessionsUsedThisMonth,
  }
}

export const browse = async (filters: {
  sector?: string
  sectors?: string
  hasFreeIntro?: boolean
  isMentor?: boolean
  combination?: string
  page?: number
  limit?: number
}) => {
  const page = filters.page ?? 1
  const limit = filters.limit ?? 20
  const skip = (page - 1) * limit

  const where: Record<string, unknown> = {
    isVerified: true,
    isActive: true,
  }

  if (filters.sector) where.sector = filters.sector
  if (filters.sectors) {
    const list = filters.sectors.split(',').map(s => s.trim()).filter(Boolean)
    if (list.length > 0) where.sector = { in: list }
  }
  if (filters.hasFreeIntro) where.offersFreeIntro = true
  if (filters.isMentor !== undefined) where.isMentor = filters.isMentor
  if (filters.combination) {
    const combos = filters.combination.split(',').map(c => c.trim()).filter(Boolean)
    where.relevantCombinations = combos.length > 1 ? { hasSome: combos } : { has: combos[0] }
  }

  const [professionals, total] = await Promise.all([
    prisma.professional.findMany({
      where,
      skip,
      take: limit,
      include: {
        reviews: { select: { rating: true } },
      },
    }),
    prisma.professional.count({ where }),
  ])

  const withRating = professionals.map((p) => {
    const avg =
      p.reviews.length > 0
        ? p.reviews.reduce((sum, r) => sum + r.rating, 0) / p.reviews.length
        : null
    const { reviews, ...safe } = p
    return { ...safe, averageRating: avg, reviewCount: reviews.length }
  })

  return { professionals: withRating, total, page, limit }
}

export const getPublicProfile = async (id: string) => {
  const professional = await prisma.professional.findUnique({
    where: { id },
    include: {
      availability: true,
      reviews: {
        include: { student: { select: { id: true } } },
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
      ProfessionalCareer: {
        include: { Career: { select: { id: true, title: true, sector: true } } },
      },
    },
  })

  if (!professional || !professional.isActive) {
    throw new Error('Professional not found')
  }

  const averageRating =
    professional.reviews.length > 0
      ? professional.reviews.reduce((sum, r) => sum + r.rating, 0) /
        professional.reviews.length
      : null

  return {
    ...professional,
    averageRating,
    careers: professional.ProfessionalCareer.map((c) => ({
      id: c.Career.id,
      title: c.Career.title,
      sector: c.Career.sector,
    })),
  }
}

export const createRecurringMentorSlots = async (professionalId: string, data: {
  daysOfWeek: number[]
  startHour: number
  startMinute: number
  endHour: number
  endMinute: number
  meetLink: string
  weeks: number
}) => {
  const { daysOfWeek, startHour, startMinute, endHour, endMinute, meetLink, weeks } = data

  if (!Array.isArray(daysOfWeek) || daysOfWeek.length === 0) {
    throw new Error('Select at least one day of the week.')
  }
  if (endHour < startHour || (endHour === startHour && endMinute <= startMinute)) {
    throw new Error('End time must be after start time.')
  }
  if (!meetLink?.trim()) {
    throw new Error('A Google Meet link is required.')
  }
  if (!Number.isInteger(weeks) || weeks < 1 || weeks > 12) {
    throw new Error('Weeks must be between 1 and 12.')
  }

  const durationMins = (endHour * 60 + endMinute) - (startHour * 60 + startMinute)

  const templates = daysOfWeek.map((dayOfWeek) => ({ dayOfWeek, startHour, startMinute, endHour, endMinute }))
  const occurrences = expandWeeklyTemplate(templates, weeks * 7)
  const scheduledDates = occurrences.map((o) => o.start)

  if (scheduledDates.length === 0) {
    return { created: 0, skipped: 0, slots: [] }
  }

  const result = await prisma.mentorSlot.createMany({
    data: scheduledDates.map((scheduledAt) => ({
      id: crypto.randomUUID(),
      professionalId,
      scheduledAt,
      durationMins,
      meetLink: meetLink.trim(),
    })),
    skipDuplicates: true,
  })

  const slots = await prisma.mentorSlot.findMany({
    where: { professionalId, scheduledAt: { in: scheduledDates } },
    orderBy: { scheduledAt: 'asc' },
  })

  return { created: result.count, skipped: scheduledDates.length - result.count, slots }
}
