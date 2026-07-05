import { prisma } from '../prisma/client'
import { CareerStoryStatus } from '@prisma/client'
import * as emailService from './email.service'

export const VALID_STUDY_CODES = [
  'HGL', 'HLP', 'LFK', 'MCB', 'MCE', 'MEG', 'MPC', 'MPG', 'PCB', 'PCM',
  'PATH_MS_NATURAL', 'PATH_MS_APPLIED', 'PATH_ARTS_HUMANITIES', 'PATH_LANGUAGES',
]

const PUBLIC_INCLUDE = {
  professional: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      jobTitle: true,
      employer: true,
      sector: true,
      profilePhoto: true,
    },
  },
}

export const list = async (filters: {
  combination?: string
  sector?: string
  search?: string
  interests?: string
  page?: number
  limit?: number
}) => {
  const page = filters.page ?? 1
  const limit = filters.limit ?? 20
  const skip = (page - 1) * limit

  const where: Record<string, unknown> = { status: 'PUBLISHED' }

  if (filters.combination) {
    const combos = filters.combination.split(',').map(c => c.trim()).filter(Boolean)
    where.combinations = combos.length > 1 ? { hasSome: combos } : { has: combos[0] }
  }
  if (filters.sector) {
    where.sector = filters.sector
  }
  if (filters.search) {
    where.OR = [
      { jobTitle: { contains: filters.search, mode: 'insensitive' } },
      { sector: { contains: filters.search, mode: 'insensitive' } },
      { myPath: { contains: filters.search, mode: 'insensitive' } },
    ]
  } else if (filters.interests) {
    const interests = filters.interests.split(',').map(i => i.trim()).filter(Boolean)
    if (interests.length > 0) {
      where.OR = interests.flatMap(interest => [
        { jobTitle: { contains: interest, mode: 'insensitive' } },
        { sector: { contains: interest, mode: 'insensitive' } },
      ])
    }
  }

  const [stories, total] = await Promise.all([
    prisma.careerStory.findMany({
      where,
      include: PUBLIC_INCLUDE,
      skip,
      take: limit,
      orderBy: { publishedAt: 'desc' },
    }),
    prisma.careerStory.count({ where }),
  ])

  return { stories, total, page, limit }
}

export const getOne = async (id: string) => {
  const story = await prisma.careerStory.findUnique({
    where: { id },
    include: PUBLIC_INCLUDE,
  })
  if (story?.status !== 'PUBLISHED') throw new Error('Story not found')
  return story
}

export const getMyStories = async (professionalId: string) => {
  return prisma.careerStory.findMany({
    where: { professionalId },
    orderBy: { createdAt: 'desc' },
  })
}

export const create = async (
  professionalId: string,
  data: {
    jobTitle: string
    sector: string
    combinations: string[]
    myPath: string
    whatIDo: string
    adviceForStudents: string
  }
) => {
  const invalid = data.combinations.filter(c => !VALID_STUDY_CODES.includes(c))
  if (invalid.length > 0) {
    throw new Error(`Invalid combinations: ${invalid.join(', ')}`)
  }

  const story = await prisma.careerStory.create({
    data: { ...data, professionalId, status: 'PENDING_REVIEW' },
  })

  ;(async () => {
    const pro = await prisma.professional.findUnique({
      where: { id: professionalId },
      select: { firstName: true, lastName: true },
    })
    if (pro) {
      await emailService.notifyAdminNewCareerStory(
        { firstName: pro.firstName, lastName: pro.lastName },
        data.jobTitle,
      )
    }
  })().catch(console.error)

  return story
}

export const adminCreate = async (
  professionalId: string,
  data: {
    jobTitle: string
    sector: string
    combinations: string[]
    myPath: string
    whatIDo: string
    adviceForStudents: string
  }
) => {
  const pro = await prisma.professional.findUnique({ where: { id: professionalId } })
  if (!pro?.isVerified) throw new Error('Professional not found or not verified')

  const invalid = data.combinations.filter(c => !VALID_STUDY_CODES.includes(c))
  if (invalid.length > 0) throw new Error(`Invalid combinations: ${invalid.join(', ')}`)

  return prisma.careerStory.create({
    data: {
      ...data,
      professionalId,
      status: 'PUBLISHED',
      publishedAt: new Date(),
    },
    include: PUBLIC_INCLUDE,
  })
}

export const listVerifiedProfessionals = async () => {
  return prisma.professional.findMany({
    where: { isVerified: true },
    select: { id: true, firstName: true, lastName: true, jobTitle: true, sector: true },
    orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
  })
}

export const update = async (
  id: string,
  professionalId: string,
  data: Partial<{
    jobTitle: string
    sector: string
    combinations: string[]
    myPath: string
    whatIDo: string
    adviceForStudents: string
  }>
) => {
  const story = await prisma.careerStory.findUnique({ where: { id } })
  if (!story) throw new Error('Story not found')
  if (story.professionalId !== professionalId) throw new Error('Forbidden')
  if (story.status !== 'DRAFT' && story.status !== 'REJECTED') {
    throw new Error('Only DRAFT or REJECTED stories can be edited')
  }

  if (data.combinations) {
    const invalid = data.combinations.filter(c => !VALID_STUDY_CODES.includes(c))
    if (invalid.length > 0) throw new Error(`Invalid combinations: ${invalid.join(', ')}`)
  }

  return prisma.careerStory.update({
    where: { id },
    data: { ...data, status: 'PENDING_REVIEW', rejectionReason: null },
  })
}

export const approve = async (id: string) => {
  const story = await prisma.careerStory.findUnique({
    where: { id },
    include: { professional: { include: { user: { select: { email: true } } } } },
  })
  if (!story) throw new Error('Story not found')
  const updated = await prisma.careerStory.update({
    where: { id },
    data: { status: 'PUBLISHED', publishedAt: new Date(), rejectionReason: null },
  })
  emailService.notifyProfessionalCareerStoryPublished(
    { firstName: story.professional.firstName, email: story.professional.user.email },
    story.jobTitle,
  ).catch(console.error)
  return updated
}

export const reject = async (id: string, rejectionReason: string) => {
  if (!rejectionReason?.trim()) throw new Error('rejectionReason is required')
  const story = await prisma.careerStory.findUnique({
    where: { id },
    include: { professional: { include: { user: { select: { email: true } } } } },
  })
  if (!story) throw new Error('Story not found')
  const updated = await prisma.careerStory.update({
    where: { id },
    data: { status: 'REJECTED', rejectionReason },
  })
  emailService.notifyProfessionalCareerStoryRejected(
    { firstName: story.professional.firstName, email: story.professional.user.email },
    story.jobTitle,
    rejectionReason,
  ).catch(console.error)
  return updated
}

export const listPending = async () => {
  return prisma.careerStory.findMany({
    where: { status: 'PENDING_REVIEW' },
    include: PUBLIC_INCLUDE,
    orderBy: { createdAt: 'asc' },
  })
}

export const listByStatus = async (status: CareerStoryStatus) => {
  const orderBy = status === 'PUBLISHED'
    ? { publishedAt: 'desc' as const }
    : { createdAt: 'asc' as const }
  return prisma.careerStory.findMany({
    where: { status },
    include: PUBLIC_INCLUDE,
    orderBy,
  })
}

export const unpublish = async (id: string) => {
  const story = await prisma.careerStory.findUnique({ where: { id } })
  if (!story) throw new Error('Story not found')
  if (story.status !== 'PUBLISHED') throw new Error('Story is not published')
  return prisma.careerStory.update({
    where: { id },
    data: { status: 'DRAFT', publishedAt: null },
  })
}

