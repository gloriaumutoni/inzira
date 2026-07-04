import { Request, Response } from 'express'
import * as careerGuidesService from '../services/careerGuides.service'
import { prisma } from '../prisma/client'
import { ok, badRequest } from '../utils/response'

export const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    ok(res, await careerGuidesService.getMe(req.auth!.userId))
  } catch (err) {
    badRequest(res, err instanceof Error ? err.message : 'Failed')
  }
}

export const getDashboard = async (req: Request, res: Response): Promise<void> => {
  try {
    ok(res, await careerGuidesService.getDashboard(req.auth!.userId))
  } catch (err) {
    badRequest(res, err instanceof Error ? err.message : 'Failed')
  }
}

export const getMySchoolStudents = async (req: Request, res: Response): Promise<void> => {
  try {
    const careerGuide = await prisma.careerGuide.findUnique({
      where: { userId: req.auth!.userId },
    })

    if (!careerGuide?.schoolId) {
      ok(res, { students: [] })
      return
    }

    const now = new Date()

    const students = await prisma.student.findMany({
      where: { schoolId: careerGuide.schoolId },
      include: {
        user: { select: { email: true, createdAt: true } },
        sessions: {
          select: {
            status: true,
            professional: {
              select: { firstName: true, lastName: true, sector: true },
            },
          },
        },
        groupEnrolments: {
          include: {
            groupSession: {
              select: {
                scheduledAt: true,
                isCancelled: true,
                professional: {
                  select: { firstName: true, lastName: true, sector: true },
                },
              },
            },
          },
        },
        confidenceLogs: {
          orderBy: { createdAt: 'asc' },
          take: 1,
          select: { score: true },
        },
      },
      orderBy: { firstName: 'asc' },
    })

    ok(res, {
      students: students.map((s) => {
        const mentorSessions = s.sessions.filter((sess) => sess.status !== 'CANCELLED')
        const activeGroupEnrolments = s.groupEnrolments.filter((e) => !e.groupSession.isCancelled)

        const profMap = new Map<string, string>()
        mentorSessions.forEach((sess) => {
          profMap.set(`${sess.professional.firstName} ${sess.professional.lastName}`, sess.professional.sector)
        })
        activeGroupEnrolments.forEach((e) => {
          profMap.set(
            `${e.groupSession.professional.firstName} ${e.groupSession.professional.lastName}`,
            e.groupSession.professional.sector,
          )
        })

        return {
          id: s.id,
          firstName: s.firstName,
          lastName: s.lastName,
          level: s.level,
          combination: s.combination ?? null,
          confidenceLevel: s.confidenceLevel ?? null,
          joinedAt: s.user.createdAt,
          mentorEnrolled: mentorSessions.length,
          mentorCompleted: mentorSessions.filter((sess) => sess.status === 'COMPLETED').length,
          groupEnrolled: activeGroupEnrolments.length,
          groupCompleted: activeGroupEnrolments.filter(
            (e) => new Date(e.groupSession.scheduledAt) < now,
          ).length,
          initialConfidence: s.confidenceLogs[0]?.score ?? null,
          professionals: Array.from(profMap.entries()).map(([name, sector]) => ({ name, sector })),
        }
      }),
    })
  } catch (err) {
    badRequest(res, err instanceof Error ? err.message : 'Failed')
  }
}

export const reapplyVerification = async (req: Request, res: Response): Promise<void> => {
  try {
    const guide = await prisma.careerGuide.findUnique({ where: { userId: req.auth!.userId } })
    if (!guide) { badRequest(res, 'Not found'); return }
    const { linkedinUrl } = req.body as { linkedinUrl?: string }
    await prisma.careerGuide.update({
      where: { id: guide.id },
      data: {
        verificationStatus: 'PENDING',
        ...(linkedinUrl === undefined ? {} : { linkedinUrl }),
      },
    })
    ok(res, { reapplied: true })
  } catch (err) {
    badRequest(res, err instanceof Error ? err.message : 'Failed')
  }
}
