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
    partnerCompanies,
    totalSessions,
    totalGroupSessions,
    totalWorkshops,
    allTimeRevenue,
    newStudentsThisWeek,
    newProfessionalsThisWeek,
    pendingProfessionalsCount,
    pendingCompaniesCount,
    sessionsThisWeek,
    sessionsLastWeek,
    paymentsThisWeek,
    paymentsLastWeek,
    registrationsThisWeek,
    registrationsLastWeek,
    recentSessionsRaw,
    sessionsForGrowth,
    studentsForGrowth,
    paymentsForGrowth,
  ] = await Promise.all([
    prisma.student.count(),
    prisma.professional.count({ where: { isVerified: true, isActive: true } }),
    prisma.company.count({ where: { isVerified: true } }),
    prisma.session.count({ where: { status: 'COMPLETED' } }),
    prisma.groupSession.count({ where: { isCancelled: false } }),
    prisma.workshop.count({ where: { status: 'ACTIVE' } }),
    prisma.payment.aggregate({ where: { status: 'SUCCESSFUL' }, _sum: { amount: true } }),
    prisma.student.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    prisma.professional.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    prisma.professional.count({ where: { isVerified: false } }),
    prisma.company.count({ where: { isVerified: false } }),
    prisma.session.count({ where: { status: 'COMPLETED', updatedAt: { gte: sevenDaysAgo } } }),
    prisma.session.count({ where: { status: 'COMPLETED', updatedAt: { gte: fourteenDaysAgo, lt: sevenDaysAgo } } }),
    prisma.payment.aggregate({ where: { status: 'SUCCESSFUL', createdAt: { gte: sevenDaysAgo } }, _sum: { amount: true } }),
    prisma.payment.aggregate({ where: { status: 'SUCCESSFUL', createdAt: { gte: fourteenDaysAgo, lt: sevenDaysAgo } }, _sum: { amount: true } }),
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
    prisma.payment.findMany({
      where: { status: 'SUCCESSFUL', createdAt: { gte: sixMonthsAgo } },
      select: { createdAt: true, amount: true },
    }),
  ])

  const grossRevenue = allTimeRevenue._sum.amount ?? 0
  const grossCommission = Math.round(grossRevenue * 0.15)
  const totalCommission = Math.round((paymentsThisWeek._sum.amount ?? 0) * 0.15)
  const totalCommissionLastWeek = Math.round((paymentsLastWeek._sum.amount ?? 0) * 0.15)

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
  for (const p of paymentsForGrowth) {
    const d = new Date(p.createdAt)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    if (monthMap[key]) monthMap[key].revenue += Math.round(p.amount / 1000)
  }
  const platformGrowth = Object.values(monthMap)

  const recentSessions = recentSessionsRaw.map((s) => ({
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
    partnerCompanies,
    totalSessions,
    totalGroupSessions,
    totalWorkshops,
    grossRevenue,
    grossCommission,
    newStudentsThisWeek,
    newProfessionalsThisWeek,
    mentorshipSessions: sessionsThisWeek,
    mentorshipSessionsLastWeek: sessionsLastWeek,
    totalCommission,
    totalCommissionLastWeek,
    userRegistrations: registrationsThisWeek,
    userRegistrationsLastWeek: registrationsLastWeek,
    supportTickets: 0,
    supportTicketsLastWeek: 0,
    platformGrowth,
    recentSessions,
    platformHealth: {
      verificationQueueClear: pendingProfessionalsCount === 0 && pendingCompaniesCount === 0,
      commissionRate: 15,
      sessionsPerWeek: sessionsThisWeek,
      activeAmbassadors: 0,
    },
  }
}

export const getPendingProfessionals = async () => {
  return prisma.professional.findMany({
    where: { isVerified: false },
    include: { user: { select: { email: true } } },
    orderBy: { createdAt: 'asc' },
  })
}

export const approveProfessional = async (id: string) => {
  const professional = await prisma.professional.update({
    where: { id },
    data: { isVerified: true },
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

  await createNotification(
    professional.userId,
    'ACCOUNT_REJECTED',
    'Profile not approved',
    `Your profile was not approved. Reason: ${reason || 'Does not meet current requirements'}`,
    '/professional/profile',
  )

  return { rejected: true, id }
}

export const getPendingCompanies = async () => {
  return prisma.company.findMany({
    where: { isVerified: false },
    include: { user: { select: { email: true } } },
    orderBy: { createdAt: 'asc' },
  })
}

export const approveCompany = async (id: string) => {
  const company = await prisma.company.update({
    where: { id },
    data: { isVerified: true },
    include: { user: true },
  })

  await createNotification(
    company.userId,
    'ACCOUNT_VERIFIED',
    'Your company account is live',
    'Your company account has been verified. You can now create workshops.',
    '/company/profile',
  )

  return company
}

export const rejectCompany = async (id: string, reason: string) => {
  const company = await prisma.company.findUnique({
    where: { id },
    include: { user: true },
  })
  if (!company) throw new Error('Company not found')

  await createNotification(
    company.userId,
    'ACCOUNT_REJECTED',
    'Account not approved',
    `Your account was not approved. Reason: ${reason || 'Does not meet current requirements'}`,
    '/company/profile',
  )

  return { rejected: true, id }
}

export const suspendProfessional = async (id: string) => {
  return prisma.professional.update({ where: { id }, data: { isActive: false } })
}

export const reinstateProfessional = async (id: string) => {
  return prisma.professional.update({ where: { id }, data: { isActive: true } })
}

export const suspendCompany = async (id: string) => {
  return prisma.company.update({ where: { id }, data: { isActive: false } })
}

export const reinstateCompany = async (id: string) => {
  return prisma.company.update({ where: { id }, data: { isActive: true } })
}

export const updateQuota = async (professionalId: string, quota: number) => {
  return prisma.professional.update({
    where: { id: professionalId },
    data: { sessionQuota: quota },
  })
}
