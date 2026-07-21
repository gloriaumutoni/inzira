import { prisma } from '../prisma/client'
import { normalizeCombinationCode } from '../utils/pathwayMap'
import { combinationToStream, leafToStream, STREAM_CODES, type StreamCode } from '../utils/streamMap'

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
  pathway?: string
  interests?: string[]
  profilePhoto?: string
  combinationsConsidering?: string[]
  careerInterests?: string[]
  onboardingCompleted?: boolean
}) => {
  const normalizedCombination =
    data.combination !== undefined ? normalizeCombinationCode(data.combination) : undefined

  return prisma.student.update({
    where: { userId },
    data: {
      ...data,
      ...(normalizedCombination !== undefined && {
        combination: normalizedCombination,
        // Stream is the primary saved unit; derive it from the (legacy) combination.
        streamCode: combinationToStream(normalizedCombination) ?? null,
      }),
      ...(data.combinationsConsidering !== undefined && {
        combinationsConsidering: data.combinationsConsidering.map((c) => normalizeCombinationCode(c)),
      }),
    },
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
  streamCode?: string,
) => {
  const student = await prisma.student.findUnique({ where: { userId } })
  if (!student) throw new Error('Student not found')

  const log = await prisma.confidenceLog.create({
    data: {
      studentId: student.id,
      score,
      note,
      streamCode: streamCode ?? null,
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

// Persist a quiz result and derive the student's primary stream from the top leaf.
// Stream is the primary saved unit; the leaf (pathway) is kept as finer detail.
export const saveQuizResult = async (
  userId: string,
  payload: { answers: unknown; scores: unknown; topPathways: string[] },
) => {
  const student = await prisma.student.findUnique({ where: { userId } })
  if (!student) throw new Error('Student not found')

  const topLeaf = payload.topPathways[0]
  const streamCode = topLeaf ? leafToStream(topLeaf) ?? null : null

  const result = await prisma.quizResult.create({
    data: {
      studentId: student.id,
      answers: payload.answers as object,
      scores: payload.scores as object,
      topPathways: payload.topPathways,
      streamCode,
    },
  })

  await prisma.student.update({
    where: { id: student.id },
    data: {
      streamCode,
      pathway: topLeaf ?? student.pathway,
      combinationsConsidering: payload.topPathways,
    },
  })

  return result
}

// Pin a specific pathway to the student's home screen.
export const savePathway = async (userId: string, pathway: string) => {
  const student = await prisma.student.findUnique({ where: { userId } })
  if (!student) throw new Error('Student not found')
  return prisma.student.update({
    where: { id: student.id },
    data: { pathway },
  })
}

// Mentor / group-session / story supply per stream (the 3 STREAM_CODES). Powers the
// pathway-comparison availability badges so O-level choice is informed by real supply.
// Stream leads; legacy combinations are mapped via combinationToStream.
export const getStreamSupply = async () => {
  const [mentors, sessions, stories] = await Promise.all([
    prisma.professional.findMany({
      where: { isMentor: true, isVerified: true, isActive: true },
      select: { relevantStreams: true, relevantCombinations: true },
    }),
    prisma.groupSession.findMany({
      where: { isCancelled: false, scheduledAt: { gte: new Date() } },
      select: { streamCodes: true, combinations: true },
    }),
    prisma.careerStory.findMany({
      where: { status: 'PUBLISHED' },
      select: { combinations: true },
    }),
  ])

  const supply = Object.fromEntries(
    STREAM_CODES.map((s) => [s, { mentorCount: 0, groupSessionCount: 0, storyCount: 0 }]),
  ) as Record<StreamCode, { mentorCount: number; groupSessionCount: number; storyCount: number }>

  const streamsFromCombos = (combos: string[]): StreamCode[] => {
    const set = new Set<StreamCode>()
    for (const c of combos) {
      const s = combinationToStream(c)
      if (s) set.add(s)
    }
    return [...set]
  }

  for (const m of mentors) {
    const streams = m.relevantStreams.length > 0
      ? (m.relevantStreams.filter((s): s is StreamCode => s in supply))
      : streamsFromCombos(m.relevantCombinations)
    for (const s of streams) supply[s].mentorCount++
  }
  for (const gs of sessions) {
    const streams = gs.streamCodes.length > 0
      ? (gs.streamCodes.filter((s): s is StreamCode => s in supply))
      : streamsFromCombos(gs.combinations)
    for (const s of streams) supply[s].groupSessionCount++
  }
  for (const st of stories) {
    for (const s of streamsFromCombos(st.combinations)) supply[s].storyCount++
  }

  return supply
}
