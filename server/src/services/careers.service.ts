import { prisma } from '../prisma/client'

export const list = async (filters: {
  sector?: string
  combination?: string
  page?: number
  limit?: number
  includeUnmatched?: boolean
}) => {
  const page = filters.page ?? 1
  const limit = filters.limit ?? 20
  const skip = (page - 1) * limit

  const where: Record<string, unknown> = { isActive: true }
  if (filters.sector) where.sector = filters.sector
  if (filters.combination) where.combinations = { has: filters.combination }
  if (!filters.includeUnmatched) {
    where.professionals = {
      some: {
        professional: {
          isMentor: true,
          isVerified: true,
          isActive: true,
        },
      },
    }
  }

  const [careers, total] = await Promise.all([
    prisma.career.findMany({ where, skip, take: limit, orderBy: { title: 'asc' } }),
    prisma.career.count({ where }),
  ])

  return { careers, total, page, limit }
}

export const getOne = async (id: string) => {
  const career = await prisma.career.findUnique({ where: { id } })
  if (!career || !career.isActive) throw new Error('Career not found')
  return career
}

export const create = async (data: {
  title: string
  description: string
  sector: string
  combinations: string[]
}) => {
  return prisma.career.create({ data })
}

export const update = async (id: string, data: {
  title?: string
  description?: string
  sector?: string
  combinations?: string[]
}) => {
  return prisma.career.update({ where: { id }, data })
}

export const toggle = async (id: string) => {
  const career = await prisma.career.findUnique({ where: { id } })
  if (!career) throw new Error('Career not found')
  return prisma.career.update({
    where: { id },
    data: { isActive: !career.isActive },
  })
}

export const remove = async (id: string) => {
  return prisma.career.delete({ where: { id } })
}
