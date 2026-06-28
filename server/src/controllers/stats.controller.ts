import { Request, Response } from 'express'
import { prisma } from '../prisma/client'
import { ok } from '../utils/response'

export const getPublicStats = async (_req: Request, res: Response): Promise<void> => {
  const [students, professionals, companies, schools] = await Promise.all([
    prisma.student.count(),
    prisma.professional.count({ where: { isVerified: true, isActive: true } }),
    prisma.company.count({ where: { isVerified: true } }),
    prisma.school.count({ where: { isActive: true } }),
  ])

  ok(res, { students, professionals, companies, partnerSchools: schools })
}
