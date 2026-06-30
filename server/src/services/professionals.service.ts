import { prisma } from '../prisma/client'

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

  const [pendingRequests, upcomingSessions, activePremiumStudents, monthlyEarnings] =
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
    ])

  return {
    pendingRequests,
    upcomingSessions,
    activePremiumStudents,
    monthlyEarnings: monthlyEarnings._sum.netAmount ?? 0,
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
  hasFreeIntro?: boolean
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
  if (filters.hasFreeIntro) where.offersFreeIntro = true

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

  return { ...professional, averageRating }
}

export const getRecommended = async (userId: string) => {
  const student = await prisma.student.findUnique({
    where: { userId },
  })

  if (!student?.combination) return []

  const combinationCode = student.combination.split(' ')[0].trim()

  const matchingCareers = await prisma.career.findMany({
    where: { combinations: { has: combinationCode }, isActive: true },
    select: { sector: true },
  })

  const sectors = [...new Set(matchingCareers.map((c) => c.sector))]
  if (sectors.length === 0) return []

  return prisma.professional.findMany({
    where: {
      sector: { in: sectors },
      isVerified: true,
      isActive: true,
    },
    take: 6,
  })
}
