import { prisma } from '../prisma/client'
import { createNotification } from './notifications.service'
import * as emailService from './email.service'
import { STREAM_CODES, STREAM_NAMES, combinationToStream } from '../utils/streamMap'

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export const getStats = async () => {
  const now = new Date()
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
  const sixMonthsAgo = new Date(now)
  sixMonthsAgo.setMonth(now.getMonth() - 5)
  sixMonthsAgo.setDate(1)
  sixMonthsAgo.setHours(0, 0, 0, 0)

  const startOfToday = new Date(now)
  startOfToday.setHours(0, 0, 0, 0)

  const [
    totalStudents,
    activeProfessionals,
    totalSessions,
    totalGroupSessions,
    newStudentsThisWeek,
    newProfessionalsThisWeek,
    pendingProfessionalsCount,
    sessionsThisWeek,
    sessionsLastWeek,
    registrationsThisWeek,
    registrationsLastWeek,
    recentMentorSessionsRaw,
    upcomingMentorSessionsRaw,
    recentGroupSessionsRaw,
    upcomingGroupSessionsRaw,
    sessionsForGrowth,
    studentsForGrowth,
    approvedProfessionals,
    approvedMentors,
    approvedCareerGuides,
    pendingProfessionals,
    pendingMentors,
    pendingCareerGuides,
    activeMentors,
  ] = await Promise.all([
    prisma.student.count(),
    prisma.professional.count({ where: { isVerified: true, isActive: true } }),
    prisma.session.count({ where: { status: 'COMPLETED' } }),
    prisma.groupSession.count({ where: { isCancelled: false } }),
    prisma.student.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    prisma.professional.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    prisma.professional.count({ where: { isVerified: false } }),
    prisma.session.count({ where: { status: 'COMPLETED', updatedAt: { gte: sevenDaysAgo } } }),
    prisma.session.count({ where: { status: 'COMPLETED', updatedAt: { gte: fourteenDaysAgo, lt: sevenDaysAgo } } }),
    prisma.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    prisma.user.count({ where: { createdAt: { gte: fourteenDaysAgo, lt: sevenDaysAgo } } }),
    prisma.session.findMany({
      take: 10,
      where: { scheduledAt: { lt: startOfToday } },
      orderBy: { scheduledAt: 'desc' },
      include: { student: { include: { school: true } } },
    }),
    prisma.session.findMany({
      take: 10,
      where: { scheduledAt: { gte: startOfToday } },
      orderBy: { scheduledAt: 'asc' },
      include: { student: { include: { school: true } } },
    }),
    prisma.groupSession.findMany({
      take: 10,
      where: { scheduledAt: { lt: startOfToday }, isCancelled: false },
      orderBy: { scheduledAt: 'desc' },
      include: { enrolments: true },
    }),
    prisma.groupSession.findMany({
      take: 10,
      where: { scheduledAt: { gte: startOfToday }, isCancelled: false },
      orderBy: { scheduledAt: 'asc' },
      include: { enrolments: true },
    }),
    prisma.session.findMany({
      where: { scheduledAt: { gte: sixMonthsAgo } },
      select: { scheduledAt: true },
    }),
    prisma.student.findMany({
      where: { createdAt: { gte: sixMonthsAgo } },
      select: { createdAt: true },
    }),
    prisma.professional.count({ where: { isVerified: true } }),
    prisma.professional.count({ where: { isMentor: true } }),
    prisma.careerGuide.count({ where: { isVerified: true } }),
    prisma.professional.count({ where: { isVerified: false } }),
    prisma.professional.count({ where: { mentorApplicationStatus: 'PENDING' } }),
    prisma.careerGuide.count({ where: { isVerified: false } }),
    prisma.professional.count({ where: { isVerified: true, isMentor: true, isActive: true } }),
  ])

  const monthMap: Record<string, { month: string; sessions: number; students: number; revenue: number }> = {}
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now)
    d.setMonth(now.getMonth() - i)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    monthMap[key] = { month: MONTH_NAMES[d.getMonth()], sessions: 0, students: 0, revenue: 0 }
  }
  for (const s of sessionsForGrowth) {
    const d = new Date(s.scheduledAt)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    if (monthMap[key]) monthMap[key].sessions += 1
  }
  for (const s of studentsForGrowth) {
    const d = new Date(s.createdAt)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    if (monthMap[key]) monthMap[key].students += 1
  }
  const platformGrowth = Object.values(monthMap)

  const mapMentorSession = (s: typeof recentMentorSessionsRaw[number]) => ({
    id: s.id,
    studentName: `${s.student.firstName} ${s.student.lastName}`,
    school: s.student.school?.name ?? null,
    status: s.status,
    scheduledAt: s.scheduledAt.toISOString(),
    grade: s.student.schoolYear,
  })

  const recentMentorSessions = recentMentorSessionsRaw.map(mapMentorSession)
  const upcomingMentorSessions = upcomingMentorSessionsRaw.map(mapMentorSession)

  const mapGroupSession = (g: typeof recentGroupSessionsRaw[number]) => ({
    id: g.id,
    title: g.title,
    sector: g.sector,
    scheduledAt: g.scheduledAt.toISOString(),
    enrolmentCount: g.enrolments.length,
    isCancelled: g.isCancelled,
  })

  const recentGroupSessions = recentGroupSessionsRaw.map(mapGroupSession)
  const upcomingGroupSessions = upcomingGroupSessionsRaw.map(mapGroupSession)

  return {
    totalStudents,
    activeProfessionals,
    totalSessions,
    totalGroupSessions,
    newStudentsThisWeek,
    newProfessionalsThisWeek,
    mentorshipSessions: sessionsThisWeek,
    mentorshipSessionsLastWeek: sessionsLastWeek,
    userRegistrations: registrationsThisWeek,
    userRegistrationsLastWeek: registrationsLastWeek,
    approvedProfessionals,
    approvedMentors,
    approvedCareerGuides,
    pendingProfessionals,
    pendingMentors,
    pendingCareerGuides,
    activeMentors,
    supportTickets: 0,
    supportTicketsLastWeek: 0,
    platformGrowth,
    recentMentorSessions,
    upcomingMentorSessions,
    recentGroupSessions,
    upcomingGroupSessions,
    platformHealth: {
      verificationQueueClear: pendingProfessionalsCount === 0,
      commissionRate: 15,
      sessionsPerWeek: sessionsThisWeek,
      activeAmbassadors: 0,
    },
  }
}

export const getPendingProfessionals = async () => {
  return prisma.professional.findMany({
    where: { verificationStatus: 'PENDING' },
    include: { user: { select: { email: true } } },
    orderBy: { createdAt: 'asc' },
  })
}

export const getPendingCareerGuides = async () => {
  return prisma.careerGuide.findMany({
    where: { verificationStatus: 'PENDING' },
    include: {
      user: { select: { email: true } },
      school: { select: { name: true, district: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
}

export const getPendingMentorApplications = async () => {
  return prisma.professional.findMany({
    where: { mentorApplicationStatus: 'PENDING' },
    include: {
      user: { select: { email: true } },
      interviewBooking: true,
    },
    orderBy: { mentorAppliedAt: 'desc' },
  })
}

export const approveCareerGuide = async (id: string) => {
  const guide = await prisma.careerGuide.update({
    where: { id },
    data: { isVerified: true, verificationStatus: 'APPROVED' },
    include: { user: { select: { email: true } } },
  })

  emailService.notifyCareerGuideVerificationApproved({
    firstName: guide.firstName,
    email: guide.user.email,
  }).catch(console.error)

  return guide
}

export const rejectCareerGuide = async (id: string, reason: string) => {
  const guide = await prisma.careerGuide.update({
    where: { id },
    data: { verificationStatus: 'REJECTED', rejectionReason: reason || null, rejectionCount: { increment: 1 } },
    include: { user: true },
  })
  await createNotification(
    guide.userId,
    'ACCOUNT_REJECTED',
    'Application not approved',
    `Your career guide application was not approved. Reason: ${reason || 'Does not meet current requirements'}`,
    '/career-guide/home',
  )

  emailService.notifyCareerGuideVerificationRejected({
    firstName: guide.firstName,
    email: guide.user.email,
  }, reason).catch(console.error)

  return { rejected: true, id }
}

export const approveMentorApplication = async (id: string) => {
  const [professional] = await prisma.$transaction([
    prisma.professional.update({
      where: { id },
      data: { isMentor: true, mentorApplicationStatus: 'APPROVED' },
      include: { user: { select: { email: true } } },
    }),
    prisma.mentorApplicationInterviewBooking.deleteMany({
      where: { professionalId: id },
    }),
  ])

  emailService.notifyProfessionalMentorApproved({
    firstName: professional.firstName,
    email: professional.user.email,
  }).catch(console.error)

  return professional
}

export const rejectMentorApplication = async (id: string, reason: string) => {
  const [professional] = await prisma.$transaction([
    prisma.professional.update({
      where: { id },
      data: { mentorApplicationStatus: 'REJECTED', mentorRejectionReason: reason || null, mentorRejectionCount: { increment: 1 } },
      include: { user: true },
    }),
    prisma.mentorApplicationInterviewBooking.deleteMany({
      where: { professionalId: id },
    }),
  ])
  await createNotification(
    professional.userId,
    'MENTOR_REJECTED',
    'Mentor application not approved',
    `Your mentor application was not approved. Reason: ${reason || 'Does not meet current requirements'}`,
    '/professional/home',
  )

  emailService.notifyProfessionalMentorRejected({
    firstName: professional.firstName,
    email: professional.user.email,
  }, reason).catch(console.error)

  return { rejected: true, id }
}

export const approveProfessional = async (id: string) => {
  const professional = await prisma.professional.update({
    where: { id },
    data: { isVerified: true, verificationStatus: 'APPROVED' },
    include: { user: true },
  })

  await createNotification(
    professional.userId,
    'ACCOUNT_VERIFIED',
    'Your profile is live',
    'Your professional profile has been verified. Students can now find you on Inzira.',
    '/professional/profile',
  )

  emailService.notifyProfessionalVerificationApproved({
    firstName: professional.firstName,
    email: professional.user.email,
  }).catch(console.error)

  return professional
}

export const rejectProfessional = async (id: string, reason: string) => {
  const professional = await prisma.professional.update({
    where: { id },
    data: { verificationStatus: 'REJECTED', rejectionReason: reason || null, rejectionCount: { increment: 1 } },
    include: { user: true },
  })

  await createNotification(
    professional.userId,
    'ACCOUNT_REJECTED',
    'Profile not approved',
    `Your profile was not approved. Reason: ${reason || 'Does not meet current requirements'}`,
    '/professional/profile',
  )

  emailService.notifyProfessionalVerificationRejected({
    firstName: professional.firstName,
    email: professional.user.email,
  }, reason).catch(console.error)

  return { rejected: true, id }
}

export const suspendProfessional = async (id: string) => {
  return prisma.professional.update({ where: { id }, data: { isActive: false } })
}

export const reinstateProfessional = async (id: string) => {
  return prisma.professional.update({ where: { id }, data: { isActive: true } })
}

export const updateQuota = async (professionalId: string, quota: number) => {
  return prisma.professional.update({
    where: { id: professionalId },
    data: { sessionQuota: quota },
  })
}

const REPORT_PAGE_SIZE = 25
const REPORT_EXPORT_CAP = 5000

export const getReportStudents = async (level: 'A_LEVEL' | 'O_LEVEL', page: number, all = false) => {
  const skip = all ? 0 : (page - 1) * REPORT_PAGE_SIZE
  const take = all ? REPORT_EXPORT_CAP : REPORT_PAGE_SIZE
  const where = { level } as const

  const [total, students] = await Promise.all([
    prisma.student.count({ where }),
    prisma.student.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        school: { select: { name: true } },
        _count: { select: { sessions: true } },
      },
    }),
  ])

  return {
    students: students.map((s) => ({
      id: s.id,
      firstName: s.firstName,
      lastName: s.lastName,
      school: s.school?.name ?? null,
      level: s.level,
      schoolYear: s.schoolYear,
      combination: s.combination ?? null,
      createdAt: s.createdAt.toISOString(),
      sessionCount: s._count.sessions,
    })),
    total,
    page,
    totalPages: Math.ceil(total / REPORT_PAGE_SIZE),
  }
}

export const getReportProfessionals = async (type: 'professional' | 'mentor' | 'rejected' | 'mentor-rejected', page: number, all = false) => {
  const skip = all ? 0 : (page - 1) * REPORT_PAGE_SIZE
  const take = all ? REPORT_EXPORT_CAP : REPORT_PAGE_SIZE
  let where: object
  if (type === 'rejected') {
    where = { verificationStatus: 'REJECTED' }
  } else if (type === 'mentor-rejected') {
    where = { mentorApplicationStatus: 'REJECTED' }
  } else if (type === 'mentor') {
    where = { isVerified: true, isMentor: true }
  } else {
    where = { isVerified: true, isMentor: false }
  }
  const now = new Date()

  const [total, professionals] = await Promise.all([
    prisma.professional.count({ where }),
    prisma.professional.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { email: true } },
        sessions: { select: { status: true, scheduledAt: true } },
      },
    }),
  ])

  return {
    professionals: professionals.map((p) => ({
      id: p.id,
      firstName: p.firstName,
      lastName: p.lastName,
      jobTitle: p.jobTitle,
      employer: p.employer,
      sector: p.sector,
      email: p.user.email,
      createdAt: p.createdAt.toISOString(),
      completedSessions: p.sessions.filter((s) => s.status === 'COMPLETED').length,
      upcomingSessions: p.sessions.filter(
        (s) => new Date(s.scheduledAt) > now && s.status !== 'CANCELLED',
      ).length,
    })),
    total,
    page,
    totalPages: Math.ceil(total / REPORT_PAGE_SIZE),
  }
}

export const getReportCareerGuides = async (page: number, status: 'approved' | 'rejected' = 'approved', all = false) => {
  const skip = all ? 0 : (page - 1) * REPORT_PAGE_SIZE
  const take = all ? REPORT_EXPORT_CAP : REPORT_PAGE_SIZE
  const where = status === 'rejected' ? { verificationStatus: 'REJECTED' } : { isVerified: true }

  const [total, guides] = await Promise.all([
    prisma.careerGuide.count({ where }),
    prisma.careerGuide.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { email: true } },
        school: { select: { name: true, district: true } },
      },
    }),
  ])

  return {
    careerGuides: guides.map((g) => ({
      id: g.id,
      firstName: g.firstName,
      lastName: g.lastName,
      email: g.user.email,
      school: g.school ? { name: g.school.name, district: g.school.district } : null,
      createdAt: g.createdAt.toISOString(),
    })),
    total,
    page,
    totalPages: Math.ceil(total / REPORT_PAGE_SIZE),
  }
}

export const getReportSummary = async () => {
  const [totalStudents, engagingStudents, totalSessions, completedSessions] = await Promise.all([
    prisma.student.count(),
    prisma.student.count({ where: { sessions: { some: {} } } }),
    prisma.session.count(),
    prisma.session.count({ where: { status: 'COMPLETED' } }),
  ])

  return {
    totalStudents,
    engagingStudents,
    totalSessions,
    completedSessions,
    completionRate: totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0,
  }
}

// ── Coverage analytics ──────────────────────────────────────────────────────

export const getCoverage = async () => {
  const [careers, mentors, stories] = await Promise.all([
    prisma.career.findMany({
      where: { isActive: true },
      include: {
        roadmapSteps: { select: { id: true } },
        _count: { select: { careerStories: { where: { status: 'PUBLISHED' } } } },
      },
      orderBy: { title: 'asc' },
    }),
    prisma.professional.findMany({
      where: { isMentor: true, isVerified: true, isActive: true },
      select: { relevantStreams: true, relevantCombinations: true, sector: true },
    }),
    prisma.careerStory.findMany({
      where: { status: 'PUBLISHED' },
      select: { streamCodes: true, combinations: true, sector: true },
    }),
  ])

  const byStream = STREAM_CODES.map((streamCode) => {
    const mentorCount = mentors.filter(
      (m) =>
        m.relevantStreams.includes(streamCode) ||
        m.relevantCombinations.some((c) => combinationToStream(c) === streamCode),
    ).length
    const storyCount = stories.filter(
      (s) =>
        s.streamCodes.includes(streamCode) ||
        s.combinations.some((c) => combinationToStream(c) === streamCode),
    ).length
    const careerCount = careers.filter(
      (c) =>
        c.streamCodes.includes(streamCode) ||
        c.combinations.some((cb) => combinationToStream(cb) === streamCode),
    ).length
    return {
      streamCode,
      streamName: STREAM_NAMES[streamCode],
      mentorCount,
      storyCount,
      careerCount,
      gap: mentorCount === 0 || storyCount === 0,
    }
  })

  const byCareer = careers.map((career) => ({
    careerId: career.id,
    title: career.title,
    mentorCount: mentors.filter(
      (m) =>
        m.sector === career.sector ||
        career.streamCodes.some((s) => m.relevantStreams.includes(s)) ||
        career.combinations.some((c) => {
          const s = combinationToStream(c)
          return s ? m.relevantStreams.includes(s) : false
        }),
    ).length,
    storyCount: career._count.careerStories,
    hasRoadmap: career.roadmapSteps.length > 0,
  }))

  return {
    byStream,
    byCareer,
    emptyStreams: byStream.filter((s) => s.gap).map((s) => s.streamCode),
    careersMissingRoadmap: careers.filter((c) => c.roadmapSteps.length === 0).map((c) => c.id),
  }
}

// ── Impact / funnel analytics ────────────────────────────────────────────────

export const getAdminImpact = async (params: { schoolId?: string; level?: string }) => {
  const studentWhere: Record<string, unknown> = {}
  if (params.schoolId) studentWhere.schoolId = params.schoolId
  if (params.level) studentWhere.level = params.level

  const [signups, quizCompletions, streamChosen, mentorSessionsBooked, confidenceLogs, allSchools] =
    await Promise.all([
      prisma.student.count({ where: studentWhere }),
      prisma.quizResult.count({ where: { student: studentWhere } }),
      prisma.student.count({ where: { ...studentWhere, streamCode: { not: null } } }),
      prisma.session.count({ where: { status: 'COMPLETED', student: studentWhere } }),
      prisma.confidenceLog.findMany({
        where: { student: studentWhere },
        select: { score: true, studentId: true, createdAt: true },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.school.findMany({ where: { isActive: true }, select: { id: true, name: true } }),
    ])

  const computeConfidenceDelta = (logs: { score: number; studentId: string }[]) => {
    const firstByStudent = new Map<string, number>()
    const latestByStudent = new Map<string, number>()
    for (const log of logs) {
      if (!firstByStudent.has(log.studentId)) firstByStudent.set(log.studentId, log.score)
      latestByStudent.set(log.studentId, log.score)
    }
    const studentIds = [...firstByStudent.keys()]
    const avgStart =
      studentIds.length
        ? studentIds.reduce((a, id) => a + (firstByStudent.get(id) ?? 0), 0) / studentIds.length
        : 0
    const avgLatest =
      studentIds.length
        ? studentIds.reduce((a, id) => a + (latestByStudent.get(id) ?? 0), 0) / studentIds.length
        : 0
    return { avgStart, avgLatest, delta: avgLatest - avgStart }
  }

  const confidence = computeConfidenceDelta(confidenceLogs)

  const bySchool = await Promise.all(
    allSchools.map(async (school) => {
      const [schoolSignups, schoolQuiz, schoolLogs] = await Promise.all([
        prisma.student.count({ where: { ...studentWhere, schoolId: school.id } }),
        prisma.quizResult.count({ where: { student: { ...studentWhere, schoolId: school.id } } }),
        prisma.confidenceLog.findMany({
          where: { student: { schoolId: school.id } },
          select: { score: true, studentId: true },
          orderBy: { createdAt: 'asc' },
        }),
      ])
      const { delta } = computeConfidenceDelta(schoolLogs)
      return {
        schoolId: school.id,
        schoolName: school.name,
        signups: schoolSignups,
        quizCompletions: schoolQuiz,
        avgDelta: delta,
      }
    }),
  )

  return {
    funnel: { signups, quizCompletions, streamChosen, mentorSessionsBooked },
    confidence,
    bySchool,
  }
}
