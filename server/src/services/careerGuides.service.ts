import { prisma } from '../prisma/client'

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
  if (!guide || !guide.schoolId) throw new Error('Career guide or school not found')

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
