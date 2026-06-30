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
    recentSessionsRaw,
    sessionsForGrowth,
    studentsForGrowth,
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
      orderBy: { createdAt: 'desc' },
      include: { student: { select: { id: true, schoolYear: true } } },
    }),
    prisma.session.findMany({
      where: { scheduledAt: { gte: sixMonthsAgo } },
      select: { scheduledAt: true },
    }),
    prisma.student.findMany({
      where: { createdAt: { gte: sixMonthsAgo } },
      select: { createdAt: true },
    }),
    prisma.professional.count({ where: { isVerified: true, isActive: true } }),
  ])

  const monthMap: Record<string, { month: string; sessions: number; students: number }> = {}
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now)
    d.setMonth(now.getMonth() - i)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    monthMap[key] = { month: MONTH_NAMES[d.getMonth()], sessions: 0, students: 0 }
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

  const recentSessions = recentSessionsRaw.map((s: typeof recentSessionsRaw[0]) => ({
    id: s.id,
    studentCode: `S${s.student.id.slice(0, 6).toUpperCase()}`,
    type: s.type,
    status: s.status,
    scheduledAt: s.scheduledAt.toISOString(),
    grade: s.student.schoolYear,
  }))

  return {
    totalStudents,
    activeProfessionals,
    activeMentors,
    totalSessions,
    totalGroupSessions,
    newStudentsThisWeek,
    newProfessionalsThisWeek,
    mentorshipSessions: sessionsThisWeek,
    mentorshipSessionsLastWeek: sessionsLastWeek,
    userRegistrations: registrationsThisWeek,
    userRegistrationsLastWeek: registrationsLastWeek,
    supportTickets: 0,
    supportTicketsLastWeek: 0,
    platformGrowth,
    recentSessions,
    platformHealth: {
      verificationQueueClear: pendingProfessionalsCount === 0,
      commissionRate: 0,
      sessionsPerWeek: sessionsThisWeek,
      activeAmbassadors: 0,
    },
  }
}

export const getPendingProfessionals = async () => {
  const professionals = await prisma.professional.findMany({
    where: { verificationStatus: 'PENDING' },
    include: { user: { select: { email: true } } },
    orderBy: { createdAt: 'desc' },
  })

  return professionals.map((p) => ({
    id: p.id,
    firstName: p.firstName,
    lastName: p.lastName,
    email: p.user.email,
    jobTitle: p.jobTitle,
    employer: p.employer,
    sector: p.sector,
    bio: p.bio,
    linkedinUrl: p.linkedinUrl,
    submittedAt: p.createdAt,
  }))
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
  const professional = await prisma.professional.findUnique({
    where: { id },
    include: { user: true },
  })
  if (!professional) throw new Error('Professional not found')

  await prisma.professional.update({
    where: { id },
    data: { verificationStatus: 'REJECTED' },
  })

  await createNotification(
    professional.userId,
    'ACCOUNT_REJECTED',
    'Profile not approved',
    `Your profile was not approved. Reason: ${reason || 'Does not meet current requirements'}`,
    '/professional/profile',
  )

  return { rejected: true, id, professional }
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
