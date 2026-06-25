import { prisma } from '../prisma/client'

export const getMe = async (userId: string) => {
  return prisma.company.findUnique({ where: { userId } })
}

export const updateMe = async (userId: string, data: {
  companyName?: string
  sector?: string
  description?: string
  website?: string
  companySize?: string
  logoUrl?: string
  contactPerson?: string
  contactPhone?: string
}) => {
  return prisma.company.update({ where: { userId }, data })
}

export const getDashboard = async (userId: string) => {
  const company = await prisma.company.findUnique({ where: { userId } })
  if (!company) throw new Error('Company not found')

  const [workshops, totalRegistrations] = await Promise.all([
    prisma.workshop.findMany({
      where: { companyId: company.id },
      include: { _count: { select: { registrations: true } } },
      orderBy: { scheduledAt: 'desc' },
    }),
    prisma.workshopRegistration.count({
      where: { workshop: { companyId: company.id } },
    }),
  ])

  const upcomingCount = workshops.filter(
    (w) => w.status === 'ACTIVE' && w.scheduledAt >= new Date()
  ).length

  return { workshops, totalRegistrations, upcomingCount }
}
