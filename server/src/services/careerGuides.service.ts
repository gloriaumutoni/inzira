import { prisma } from '../prisma/client'
import { isStreamCode, combinationToStream, type StreamCode } from '../utils/streamMap'

const weekStartKey = (d: Date): string => {
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
  date.setUTCDate(date.getUTCDate() - date.getUTCDay())
  return date.toISOString().slice(0, 10)
}

export const getMe = async (userId: string) => {
  return prisma.careerGuide.findUnique({
    where: { userId },
    include: { school: true },
  })
}

export const getDashboard = async (userId: string) => {
  const guide = await prisma.careerGuide.findUnique({
    where: { userId },
    include: { school: true },
  })
  if (!guide?.schoolId) throw new Error('Career guide or school not found')

  const students = await prisma.student.findMany({
    where: { schoolId: guide.schoolId },
    include: {
      confidenceLogs: { orderBy: { createdAt: 'desc' }, take: 1 },
      sessions: { where: { status: 'COMPLETED' } },
      groupEnrolments: true,
    },
  })

  const totalStudents = students.length
  const avgConfidence =
    students.length > 0
      ? students.reduce((sum, s) => sum + (s.confidenceLevel ?? 0), 0) / students.length
      : 0

  const totalSessions = students.reduce((sum, s) => sum + s.sessions.length, 0)

  const cohort = students.map((s) => ({
    code: `S${s.id.slice(0, 6).toUpperCase()}`,
    level: s.level,
    combination: s.combination,
    pathway: s.pathway,
    sessionsCompleted: s.sessions.length,
    groupSessionsJoined: s.groupEnrolments.length,
    confidence: s.confidenceLevel,
  }))

  const systemBreakdown = {
    legacy: students.filter((s) => s.combination && !s.pathway).length,
    pathway: students.filter((s) => s.pathway).length,
    undecided: students.filter((s) => !s.combination && !s.pathway).length,
  }

  return {
    school: guide.school,
    totalStudents,
    avgConfidence,
    totalSessions,
    systemBreakdown,
    cohort,
  }
}

export const getCohortQuizSummary = async (userId: string) => {
  const guide = await prisma.careerGuide.findUnique({ where: { userId } })
  if (!guide?.schoolId) throw new Error('Career guide or school not found')

  const students = await prisma.student.findMany({
    where: { schoolId: guide.schoolId },
    select: {
      streamCode: true,
      combination: true,
      quizResults: { select: { id: true } },
      confidenceLogs: { select: { score: true, createdAt: true }, orderBy: { createdAt: 'asc' } },
    },
  })

  const totalStudents = students.length
  const quizzedCount = students.filter((s) => s.quizResults.length > 0).length

  const streamDistribution: Record<StreamCode, number> = {
    MATH_SCIENCES: 0,
    ARTS_HUMANITIES: 0,
    LANGUAGES: 0,
  }
  for (const s of students) {
    const stream = s.streamCode && isStreamCode(s.streamCode) ? s.streamCode : combinationToStream(s.combination)
    if (stream) streamDistribution[stream]++
  }

  const weekBuckets = new Map<string, { sum: number; count: number }>()
  for (const s of students) {
    for (const log of s.confidenceLogs) {
      const key = weekStartKey(log.createdAt)
      const bucket = weekBuckets.get(key) ?? { sum: 0, count: 0 }
      bucket.sum += log.score
      bucket.count += 1
      weekBuckets.set(key, bucket)
    }
  }
  const confidenceTrend = [...weekBuckets.entries()]
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([week, { sum, count }]) => ({ week, avgConfidence: sum / count }))

  return { totalStudents, quizzedCount, streamDistribution, confidenceTrend }
}

export const getImpact = async (userId: string) => {
  const guide = await prisma.careerGuide.findUnique({ where: { userId } })
  if (!guide?.schoolId) throw new Error('Career guide or school not found')

  const students = await prisma.student.findMany({
    where: { schoolId: guide.schoolId },
    select: {
      streamCode: true,
      combination: true,
      quizResults: { select: { id: true } },
      confidenceLogs: { select: { score: true, createdAt: true }, orderBy: { createdAt: 'asc' } },
    },
  })

  const signups = students.length
  const quizCompletions = students.filter((s) => s.quizResults.length > 0).length
  const streamChosenCount = students.filter(
    (s) => (s.streamCode && isStreamCode(s.streamCode)) || !!combinationToStream(s.combination),
  ).length

  const avg = (arr: number[]) => (arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0)
  const starts = students.filter((s) => s.confidenceLogs.length > 0).map((s) => s.confidenceLogs[0].score)
  const latests = students
    .filter((s) => s.confidenceLogs.length > 0)
    .map((s) => s.confidenceLogs[s.confidenceLogs.length - 1].score)
  const avgConfidenceStart = avg(starts)
  const avgConfidenceLatest = avg(latests)

  return {
    signups,
    quizCompletions,
    streamChosenCount,
    avgConfidenceStart,
    avgConfidenceLatest,
    deltaConfidence: avgConfidenceLatest - avgConfidenceStart,
  }
}

