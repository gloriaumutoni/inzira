import { prisma } from '../prisma/client'
import { createNotification } from './notifications.service'

export const getStats = async () => {
  const [
    totalStudents,
    totalProfessionals,
    totalCompanies,
    totalSessions,
    totalGroupSessions,
    totalWorkshops,
    revenue,
  ] = await Promise.all([
    prisma.student.count(),
    prisma.professional.count({ where: { isVerified: true } }),
    prisma.company.count({ where: { isVerified: true } }),
    prisma.session.count({ where: { status: 'COMPLETED' } }),
    prisma.groupSession.count({ where: { isCancelled: false } }),
    prisma.workshop.count({ where: { status: 'ACTIVE' } }),
    prisma.payment.aggregate({
      where: { status: 'SUCCESSFUL' },
      _sum: { amount: true },
    }),
  ])

  const grossRevenue = revenue._sum.amount ?? 0
  const commission = Math.round(grossRevenue * 0.15)

  return {
    totalStudents,
    totalProfessionals,
    totalCompanies,
    totalSessions,
    totalGroupSessions,
    totalWorkshops,
    grossRevenue,
    commission,
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
    '/professional/profile'
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
    `Your profile was not approved. Reason: ${reason}`,
    '/professional/profile'
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
    '/company/profile'
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
    `Your account was not approved. Reason: ${reason}`,
    '/company/profile'
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
