import { prisma } from '../prisma/client'
import { expandWeeklyTemplate } from '../utils/slots'
import { STREAM_CODES, STREAM_NAMES, combinationToStream, combinationsToStreams, type StreamCode } from '../utils/streamMap'

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
  relevantStreams?: string[]
  relevantCombinations?: string[]
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
  slots: { dayOfWeek: number; startHour: number }[]
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

  const [pendingRequests, upcomingSessions, activePremiumStudents, completedCount] =
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
      prisma.session.count({
        where: { professionalId: professional.id, status: 'COMPLETED' },
      }),
    ])

  return {
    pendingRequests,
    upcomingSessions,
    activePremiumStudents,
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

// Streams a mentor/story serves: relevantStreams/streamCodes lead, legacy
// combination fields are a fallback for records not yet re-tagged.
const streamsFromMentor = (m: { relevantStreams: string[]; relevantCombinations: string[] }): StreamCode[] =>
  m.relevantStreams.length > 0
    ? m.relevantStreams.filter((s): s is StreamCode => (STREAM_CODES as readonly string[]).includes(s))
    : combinationsToStreams(m.relevantCombinations)

const streamsFromStory = (s: { streamCodes: string[]; combinations: string[] }): StreamCode[] =>
  s.streamCodes.length > 0
    ? s.streamCodes.filter((c): c is StreamCode => (STREAM_CODES as readonly string[]).includes(c))
    : combinationsToStreams(s.combinations)

const streamsFromCareer = (c: { streamCodes: string[]; combinations: string[] }): StreamCode[] =>
  c.streamCodes.length > 0
    ? c.streamCodes.filter((s): s is StreamCode => (STREAM_CODES as readonly string[]).includes(s))
    : combinationsToStreams(c.combinations)

// "Careers in your area with no coverage" — active careers with zero mentors
// or zero published stories, scoped to the calling professional's streams
// (their relevantStreams, or relevantCombinations mapped legacy).
export const getCoverageGaps = async (userId: string) => {
  const professional = await prisma.professional.findUnique({
    where: { userId },
    select: { relevantStreams: true, relevantCombinations: true },
  })
  if (!professional) throw new Error('Professional not found')
  const myStreams = streamsFromMentor(professional)

  const [careers, mentors, stories] = await Promise.all([
    prisma.career.findMany({
      where: { isActive: true },
      select: { id: true, title: true, streamCodes: true, combinations: true },
    }),
    prisma.professional.findMany({
      where: { isMentor: true, isVerified: true, isActive: true },
      select: { relevantStreams: true, relevantCombinations: true },
    }),
    prisma.careerStory.findMany({
      where: { status: 'PUBLISHED' },
      select: { streamCodes: true, combinations: true },
    }),
  ])

  const gaps: {
    streamCode: string
    streamName: string
    careerTitle: string
    careerId: string
    mentorCount: number
    storyCount: number
    matchesMe: boolean
  }[] = []

  for (const career of careers) {
    const streams = streamsFromCareer(career)
    const mentorCount = mentors.filter((m) => streamsFromMentor(m).some((s) => streams.includes(s))).length
    const storyCount = stories.filter((s) => streamsFromStory(s).some((st) => streams.includes(st))).length
    if (mentorCount > 0 && storyCount > 0) continue
    if (streams.length === 0) continue // untagged career — no specific stream to flag

    for (const streamCode of streams) {
      const matchesMe = myStreams.length === 0 || myStreams.includes(streamCode)
      if (myStreams.length > 0 && !matchesMe) continue
      gaps.push({
        streamCode,
        streamName: STREAM_NAMES[streamCode],
        careerTitle: career.title,
        careerId: career.id,
        mentorCount,
        storyCount,
        matchesMe,
      })
    }
  }

  return { myStreams, gaps }
}
