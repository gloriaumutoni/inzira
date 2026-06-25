import { prisma } from '../prisma/client'

export const list = async (filters: {
  sector?: string
  format?: string
  upcomingOnly?: boolean
  page?: number
  limit?: number
}) => {
  const page = filters.page ?? 1
  const limit = filters.limit ?? 20
  const skip = (page - 1) * limit

  const where: Record<string, unknown> = { status: 'ACTIVE' }
  if (filters.sector) where.sector = filters.sector
  if (filters.format) where.format = filters.format
  if (filters.upcomingOnly) where.scheduledAt = { gte: new Date() }

  const [workshops, total] = await Promise.all([
    prisma.workshop.findMany({
      where,
      skip,
      take: limit,
      include: {
        company: { select: { id: true, companyName: true, logoUrl: true } },
        agendaItems: { orderBy: { order: 'asc' } },
        _count: { select: { registrations: true } },
      },
      orderBy: { scheduledAt: 'asc' },
    }),
    prisma.workshop.count({ where }),
  ])

  return { workshops, total, page, limit }
}

export const getOwn = async (companyUserId: string) => {
  const company = await prisma.company.findUnique({ where: { userId: companyUserId } })
  if (!company) throw new Error('Company not found')

  return prisma.workshop.findMany({
    where: { companyId: company.id },
    include: {
      agendaItems: { orderBy: { order: 'asc' } },
      _count: { select: { registrations: true } },
    },
    orderBy: { scheduledAt: 'desc' },
  })
}

export const getOne = async (id: string) => {
  const workshop = await prisma.workshop.findUnique({
    where: { id },
    include: {
      company: { select: { id: true, companyName: true, logoUrl: true } },
      agendaItems: { orderBy: { order: 'asc' } },
      _count: { select: { registrations: true } },
    },
  })
  if (!workshop) throw new Error('Workshop not found')
  return workshop
}

export const create = async (
  companyUserId: string,
  data: {
    title: string
    description: string
    sector: string
    format: 'IN_PERSON' | 'ONLINE'
    location?: string
    meetingLink?: string
    scheduledAt: string
    duration: number
    maxRegistrations?: number
    registrationDeadline?: string
    contactPerson: string
    contactEmail: string
    hasRefreshments?: boolean
    hasCertificate?: boolean
    specialRequirements?: string
    agendaItems?: { order: number; content: string }[]
  }
) => {
  const company = await prisma.company.findUnique({ where: { userId: companyUserId } })
  if (!company) throw new Error('Company not found')
  if (!company.isVerified) throw new Error('Your account must be verified before creating workshops')

  const { agendaItems, ...workshopData } = data

  return prisma.workshop.create({
    data: {
      ...workshopData,
      companyId: company.id,
      scheduledAt: new Date(data.scheduledAt),
      registrationDeadline: data.registrationDeadline
        ? new Date(data.registrationDeadline)
        : undefined,
      agendaItems: agendaItems
        ? { create: agendaItems }
        : undefined,
    },
    include: { agendaItems: true },
  })
}

export const update = async (
  id: string,
  companyUserId: string,
  data: Record<string, unknown>
) => {
  const company = await prisma.company.findUnique({ where: { userId: companyUserId } })
  if (!company) throw new Error('Company not found')

  const workshop = await prisma.workshop.findUnique({ where: { id } })
  if (!workshop) throw new Error('Workshop not found')
  if (workshop.companyId !== company.id) throw new Error('Access denied')

  const { scheduledAt, registrationDeadline, ...rest } = data as {
    scheduledAt?: string
    registrationDeadline?: string
    [key: string]: unknown
  }

  return prisma.workshop.update({
    where: { id },
    data: {
      ...rest,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
      registrationDeadline: registrationDeadline
        ? new Date(registrationDeadline)
        : undefined,
    },
  })
}

export const publish = async (id: string, companyUserId: string) => {
  const company = await prisma.company.findUnique({ where: { userId: companyUserId } })
  if (!company) throw new Error('Company not found')

  const workshop = await prisma.workshop.findUnique({ where: { id } })
  if (!workshop) throw new Error('Workshop not found')
  if (workshop.companyId !== company.id) throw new Error('Access denied')
  if (workshop.status !== 'DRAFT') throw new Error('Only draft workshops can be published')

  return prisma.workshop.update({ where: { id }, data: { status: 'ACTIVE' } })
}

export const cancelWorkshop = async (
  id: string,
  requestingUserId: string,
  role: string
) => {
  const workshop = await prisma.workshop.findUnique({ where: { id } })
  if (!workshop) throw new Error('Workshop not found')

  if (role === 'COMPANY') {
    const company = await prisma.company.findUnique({ where: { userId: requestingUserId } })
    if (workshop.companyId !== company?.id) throw new Error('Access denied')
  }

  return prisma.workshop.update({ where: { id }, data: { status: 'CANCELLED' } })
}

export const register = async (workshopId: string, studentUserId: string) => {
  const student = await prisma.student.findUnique({ where: { userId: studentUserId } })
  if (!student) throw new Error('Student not found')

  const workshop = await prisma.workshop.findUnique({
    where: { id: workshopId },
    include: { _count: { select: { registrations: true } } },
  })
  if (!workshop) throw new Error('Workshop not found')
  if (workshop.status !== 'ACTIVE') throw new Error('Workshop is not available for registration')
  if (workshop.registrationDeadline && workshop.registrationDeadline < new Date()) {
    throw new Error('Registration deadline has passed')
  }
  if (workshop.maxRegistrations && workshop._count.registrations >= workshop.maxRegistrations) {
    throw new Error('Workshop is full')
  }

  const existing = await prisma.workshopRegistration.findUnique({
    where: { workshopId_studentId: { workshopId, studentId: student.id } },
  })
  if (existing) throw new Error('You are already registered for this workshop')

  return prisma.workshopRegistration.create({
    data: { workshopId, studentId: student.id },
  })
}

export const unregister = async (workshopId: string, studentUserId: string) => {
  const student = await prisma.student.findUnique({ where: { userId: studentUserId } })
  if (!student) throw new Error('Student not found')

  return prisma.workshopRegistration.delete({
    where: { workshopId_studentId: { workshopId, studentId: student.id } },
  })
}

export const getRegistrations = async (
  workshopId: string,
  requestingUserId: string,
  role: string
) => {
  if (role === 'COMPANY') {
    const company = await prisma.company.findUnique({ where: { userId: requestingUserId } })
    const workshop = await prisma.workshop.findUnique({ where: { id: workshopId } })
    if (workshop?.companyId !== company?.id) throw new Error('Access denied')
  }

  const registrations = await prisma.workshopRegistration.findMany({
    where: { workshopId },
    include: {
      student: { include: { school: true } },
    },
    orderBy: { registeredAt: 'desc' },
  })

  return registrations.map((r) => ({
    code: `S${r.student.id.slice(0, 6).toUpperCase()}`,
    school: r.student.school?.name ?? 'Unknown',
    level: r.student.level,
    combination: r.student.combination,
    registeredAt: r.registeredAt,
  }))
}
