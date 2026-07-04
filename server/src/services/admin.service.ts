import { prisma } from '../prisma/client'
import { createNotification } from './notifications.service'

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
    type: s.type,
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
  return prisma.careerGuide.update({
    where: { id },
    data: { isVerified: true, verificationStatus: 'APPROVED' },
  })
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
  return { rejected: true, id }
}

export const approveMentorApplication = async (id: string) => {
  const [professional] = await prisma.$transaction([
    prisma.professional.update({
      where: { id },
      data: { isMentor: true, mentorApplicationStatus: 'APPROVED' },
    }),
    prisma.mentorApplicationInterviewBooking.deleteMany({
      where: { professionalId: id },
    }),
  ])
  return professional
}

export const rejectMentorApplication = async (id: string, reason: string) => {
  const [professional] = await prisma.$transaction([
    prisma.professional.update({
      where: { id },
      data: { mentorApplicationStatus: 'REJECTED', mentorRejectionReason: reason || null, mentorApplicationAttempts: { increment: 1 } },
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

  return professional
}

export const rejectProfessional = async (id: string, reason: string) => {
  const professional = await prisma.professional.update({
    where: { id },
    data: { verificationStatus: 'REJECTED', rejectionReason: reason || null, verificationAttempts: { increment: 1 } },
    include: { user: true },
  })

  await createNotification(
    professional.userId,
    'ACCOUNT_REJECTED',
    'Profile not approved',
    `Your profile was not approved. Reason: ${reason || 'Does not meet current requirements'}`,
    '/professional/profile',
  )

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

export const getReportStudents = async (level: 'A_LEVEL' | 'O_LEVEL', page: number) => {
  const skip = (page - 1) * REPORT_PAGE_SIZE
  const where = { level } as const

  const [total, students] = await Promise.all([
    prisma.student.count({ where }),
    prisma.student.findMany({
      where,
      skip,
      take: REPORT_PAGE_SIZE,
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

export const getReportProfessionals = async (type: 'professional' | 'mentor' | 'rejected' | 'mentor-rejected', page: number) => {
  const skip = (page - 1) * REPORT_PAGE_SIZE
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
      take: REPORT_PAGE_SIZE,
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

export const getReportCareerGuides = async (page: number, status: 'approved' | 'rejected' = 'approved') => {
  const skip = (page - 1) * REPORT_PAGE_SIZE
  const where = status === 'rejected' ? { verificationStatus: 'REJECTED' } : { isVerified: true }

  const [total, guides] = await Promise.all([
    prisma.careerGuide.count({ where }),
    prisma.careerGuide.findMany({
      where,
      skip,
      take: REPORT_PAGE_SIZE,
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
