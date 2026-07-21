import { prisma } from '../prisma/client'
import { reachabilityForStream, combinationToStream, type StreamCode } from '../utils/streamMap'

const MENTOR_WHERE = { isMentor: true, isVerified: true, isActive: true } as const

const shortDescription = (text: string, max = 160) =>
  text.length > max ? `${text.slice(0, max).trimEnd()}…` : text

export const list = async (filters: {
  sector?: string
  combination?: string
  page?: number
  limit?: number
  includeUnmatched?: boolean
}) => {
  const page = filters.page ?? 1
  const limit = filters.limit ?? 20
  const skip = (page - 1) * limit

  const where: Record<string, unknown> = { isActive: true }
  if (filters.sector) where.sector = filters.sector
  if (filters.combination) where.combinations = { has: filters.combination }
  if (!filters.includeUnmatched) {
    const mentorSectors = await prisma.professional
      .findMany({
        where: { isMentor: true, isVerified: true, isActive: true },
        select: { sector: true },
      })
      .then((mentors) => [...new Set(mentors.map((m) => m.sector))])

    where.OR = [
      {
        professionals: {
          some: {
            professional: { isMentor: true, isVerified: true, isActive: true },
          },
        },
      },
      ...(mentorSectors.length > 0 ? [{ sector: { in: mentorSectors } }] : []),
    ]
  }

  const [careers, total] = await Promise.all([
    prisma.career.findMany({ where, skip, take: limit, orderBy: { title: 'asc' } }),
    prisma.career.count({ where }),
  ])

  return { careers, total, page, limit }
}

export const getOne = async (id: string) => {
  const career = await prisma.career.findUnique({ where: { id } })
  if (!career || !career.isActive) throw new Error('Career not found')
  return career
}

type UniversityProgram = {
  program: string
  institutions?: string[]
  entryRequirements?: string
  durationYears?: number
  indicativeCostRwf?: number
}

// Derive streamCodes from legacy combinations when the caller doesn't supply them,
// so a career never starts untagged during the combination->stream transition.
const resolveStreamCodes = (streamCodes: string[] | undefined, combinations: string[]): string[] => {
  if (streamCodes && streamCodes.length > 0) return streamCodes
  const derived = new Set<string>()
  for (const c of combinations) {
    const s = combinationToStream(c)
    if (s) derived.add(s)
  }
  return [...derived]
}

export const create = async (data: {
  title: string
  description: string
  sector: string
  streamCodes?: string[]
  combinations: string[]
  pathwayCodes?: string[]
  universityPrograms?: UniversityProgram[]
  keySkills?: string[]
}) => {
  return prisma.career.create({
    data: {
      title: data.title,
      description: data.description,
      sector: data.sector,
      streamCodes: resolveStreamCodes(data.streamCodes, data.combinations),
      combinations: data.combinations,
      pathwayCodes: data.pathwayCodes ?? [],
      universityPrograms: data.universityPrograms ?? undefined,
      keySkills: data.keySkills ?? [],
    },
  })
}

export const update = async (id: string, data: {
  title?: string
  description?: string
  sector?: string
  streamCodes?: string[]
  combinations?: string[]
  pathwayCodes?: string[]
  universityPrograms?: UniversityProgram[]
  keySkills?: string[]
}) => {
  return prisma.career.update({
    where: { id },
    data: {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.sector !== undefined && { sector: data.sector }),
      ...(data.streamCodes !== undefined && { streamCodes: data.streamCodes }),
      ...(data.combinations !== undefined && { combinations: data.combinations }),
      ...(data.pathwayCodes !== undefined && { pathwayCodes: data.pathwayCodes }),
      ...(data.universityPrograms !== undefined && { universityPrograms: data.universityPrograms }),
      ...(data.keySkills !== undefined && { keySkills: data.keySkills }),
    },
  })
}

export const toggle = async (id: string) => {
  const career = await prisma.career.findUnique({ where: { id } })
  if (!career) throw new Error('Career not found')
  return prisma.career.update({
    where: { id },
    data: { isActive: !career.isActive },
  })
}

export const remove = async (id: string) => {
  return prisma.career.delete({ where: { id } })
}

const mentorCard = (m: {
  id: string
  firstName: string
  lastName: string
  jobTitle: string
  employer: string
  sector: string
  profilePhoto: string | null
  relevantStreams: string[]
  relevantCombinations: string[]
}) => ({
  id: m.id,
  firstName: m.firstName,
  lastName: m.lastName,
  jobTitle: m.jobTitle,
  employer: m.employer,
  sector: m.sector,
  profilePhoto: m.profilePhoto,
})

// Streams a career belongs to: its own streamCodes, else derived from legacy combinations.
const careerStreams = (career: { streamCodes: string[]; combinations: string[] }): StreamCode[] => {
  if (career.streamCodes.length > 0) return career.streamCodes as StreamCode[]
  const set = new Set<StreamCode>()
  for (const c of career.combinations) {
    const s = combinationToStream(c)
    if (s) set.add(s)
  }
  return [...set]
}

// A mentor or story serves a career when their stream overlaps the career's
// streams, or they share the sector. relevantStreams/streamCodes lead;
// legacy relevantCombinations/combinations are a fallback for untagged records.
const mentorServesStreams = (
  m: { relevantStreams: string[]; relevantCombinations: string[]; sector: string },
  streams: StreamCode[],
  sector: string,
) =>
  m.sector === sector ||
  m.relevantStreams.some((s) => streams.includes(s as StreamCode)) ||
  m.relevantCombinations.some((c) => {
    const s = combinationToStream(c)
    return s ? streams.includes(s) : false
  })

const storyServesStreams = (
  s: { streamCodes: string[]; combinations: string[]; sector: string },
  streams: StreamCode[],
  sector: string,
) =>
  s.sector === sector ||
  s.streamCodes.some((st) => streams.includes(st as StreamCode)) ||
  s.combinations.some((c) => {
    const st = combinationToStream(c)
    return st ? streams.includes(st) : false
  })

// Full roadmap for one career: programs, steps, matching mentors + stories.
export const getRoadmap = async (id: string) => {
  const career = await prisma.career.findUnique({
    where: { id },
    include: { roadmapSteps: { orderBy: { order: 'asc' } } },
  })
  if (!career || !career.isActive) throw new Error('Career not found')

  const streams = careerStreams(career)

  const [mentors, stories] = await Promise.all([
    prisma.professional.findMany({
      where: MENTOR_WHERE,
      select: {
        id: true, firstName: true, lastName: true, jobTitle: true,
        employer: true, sector: true, profilePhoto: true,
        relevantStreams: true, relevantCombinations: true,
      },
    }),
    prisma.careerStory.findMany({
      where: { status: 'PUBLISHED' },
      select: {
        id: true, jobTitle: true, sector: true, streamCodes: true, combinations: true, myPath: true,
        universityStudied: true, program: true, entryRequirements: true,
        firstJobStep: true, yearsToGetThere: true, keySkills: true, linkedCareerId: true,
        professional: {
          select: { id: true, firstName: true, lastName: true, jobTitle: true, employer: true, profilePhoto: true },
        },
      },
      orderBy: { publishedAt: 'desc' },
    }),
  ])

  // A story explicitly linked to this career always counts, even if its
  // stream tag doesn't overlap — the professional authored it for this career.
  const matchedMentors = mentors.filter((m) => mentorServesStreams(m, streams, career.sector))
  const matchedStories = stories
    .filter((s) => s.linkedCareerId === career.id || storyServesStreams(s, streams, career.sector))
    .slice(0, 12)

  return {
    id: career.id,
    title: career.title,
    sector: career.sector,
    description: career.description,
    requiredStreams: streams,
    requiredCombinations: career.combinations,
    typicalPathways: career.pathwayCodes,
    universityPrograms: (career.universityPrograms as unknown) ?? [],
    steps: career.roadmapSteps.map((s) => ({
      order: s.order,
      title: s.title,
      detail: s.detail,
      timeframe: s.timeframe,
    })),
    keySkills: career.keySkills,
    mentors: matchedMentors.map(mentorCard),
    stories: matchedStories,
  }
}

// Careers reachable from the logged-in student's stream, split direct/stretch.
// Stream leads; legacy combination is a fallback for remaining S6 students.
export const getReachableFromStream = async (userId: string) => {
  const student = await prisma.student.findUnique({
    where: { userId },
    select: { streamCode: true, combination: true },
  })
  const fromStream = (student?.streamCode as StreamCode | null) ?? null
  const fromCombination = student?.combination ?? null

  if (!fromStream && !fromCombination) {
    return { fromStream: null, fromCombination: null, reachable: [], stretch: [] }
  }

  const [careers, mentors, stories] = await Promise.all([
    prisma.career.findMany({
      where: { isActive: true },
      select: {
        id: true, title: true, sector: true, description: true,
        streamCodes: true, combinations: true, pathwayCodes: true,
      },
    }),
    prisma.professional.findMany({
      where: MENTOR_WHERE,
      select: { relevantStreams: true, relevantCombinations: true, sector: true },
    }),
    prisma.careerStory.findMany({
      where: { status: 'PUBLISHED' },
      select: { sector: true, streamCodes: true, combinations: true },
    }),
  ])

  const reachable: ReturnType<typeof toCard>[] = []
  const stretch: ReturnType<typeof toCard>[] = []

  function toCard(
    career: (typeof careers)[number],
    streams: StreamCode[],
    reach: 'DIRECT' | 'STRETCH',
  ) {
    return {
      id: career.id,
      title: career.title,
      sector: career.sector,
      shortDescription: shortDescription(career.description),
      reachability: reach,
      mentorCount: mentors.filter((m) => mentorServesStreams(m, streams, career.sector)).length,
      storyCount: stories.filter((s) => storyServesStreams(s, streams, career.sector)).length,
    }
  }

  for (const career of careers) {
    const streams = careerStreams(career)
    const reach = reachabilityForStream({
      studentStream: fromStream,
      studentCombination: fromCombination,
      careerStreamCodes: streams,
      careerCombinations: career.combinations,
      careerLeafCodes: career.pathwayCodes,
    })
    if (reach === 'DIRECT') reachable.push(toCard(career, streams, 'DIRECT'))
    else if (reach === 'STRETCH') stretch.push(toCard(career, streams, 'STRETCH'))
  }

  const byMentors = (a: { mentorCount: number }, b: { mentorCount: number }) => b.mentorCount - a.mentorCount
  reachable.sort(byMentors)
  stretch.sort(byMentors)

  return { fromStream, fromCombination, reachable, stretch }
}

export const getSectors = async () => {
  const careers = await prisma.career.findMany({
    where: { isActive: true },
    select: { sector: true },
    distinct: ['sector'],
    orderBy: { sector: 'asc' },
  })
  return careers.map(c => c.sector)
}

// Admin: list all careers (including inactive) with roadmap steps.
export const adminListAll = async () => {
  return prisma.career.findMany({
    orderBy: { title: 'asc' },
    include: { roadmapSteps: { orderBy: { order: 'asc' } } },
  })
}

// Roadmap step CRUD (admin-owned).
export const addStep = async (
  careerId: string,
  data: { order: number; title: string; detail: string; timeframe?: string },
) => {
  const career = await prisma.career.findUnique({ where: { id: careerId } })
  if (!career) throw new Error('Career not found')
  return prisma.careerRoadmapStep.create({ data: { careerId, ...data } })
}

export const updateStep = async (
  careerId: string,
  stepId: string,
  data: { order?: number; title?: string; detail?: string; timeframe?: string | null },
) => {
  const step = await prisma.careerRoadmapStep.findFirst({ where: { id: stepId, careerId } })
  if (!step) throw new Error('Step not found')
  return prisma.careerRoadmapStep.update({ where: { id: stepId }, data })
}

export const removeStep = async (careerId: string, stepId: string) => {
  const step = await prisma.careerRoadmapStep.findFirst({ where: { id: stepId, careerId } })
  if (!step) throw new Error('Step not found')
  return prisma.careerRoadmapStep.delete({ where: { id: stepId } })
}
