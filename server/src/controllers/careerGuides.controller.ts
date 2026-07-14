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
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    const students = await prisma.student.findMany({
      where: { schoolId: careerGuide.schoolId },
      include: {
        user: { select: { email: true, createdAt: true, lastLoginAt: true } },
        sessions: {
          select: {
            status: true,
            scheduledAt: true,
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
          select: { score: true, createdAt: true },
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

        const completedMentorSessions = mentorSessions.filter((sess) => sess.status === 'COMPLETED')
        const pastGroupEnrolments = activeGroupEnrolments.filter(
          (e) => new Date(e.groupSession.scheduledAt) < now,
        )
        const totalSessions = completedMentorSessions.length + pastGroupEnrolments.length

        // last session date across both types
        const mentorDates = completedMentorSessions.map((sess) => new Date(sess.scheduledAt).getTime())
        const groupDates = pastGroupEnrolments.map((e) => new Date(e.groupSession.scheduledAt).getTime())
        const allSessionDates = [...mentorDates, ...groupDates]
        const lastSessionMs = allSessionDates.length > 0 ? Math.max(...allSessionDates) : null
        const lastSessionDate = lastSessionMs ? new Date(lastSessionMs).toISOString() : null

        // confidence
        const baselineConfidence = s.confidenceLogs[0]?.score ?? null
        const currentConfidence = s.confidenceLogs[s.confidenceLogs.length - 1]?.score ?? null
        const confidenceDelta =
          baselineConfidence !== null && currentConfidence !== null
            ? currentConfidence - baselineConfidence
            : null

        // last active date: max of lastSession, lastConfidenceLog, lastLogin
        const lastConfidenceMs =
          s.confidenceLogs.length > 0
            ? new Date(s.confidenceLogs[s.confidenceLogs.length - 1].createdAt).getTime()
            : null
        const lastLoginMs = s.user.lastLoginAt ? new Date(s.user.lastLoginAt).getTime() : null
        const candidates = [lastSessionMs, lastConfidenceMs, lastLoginMs].filter(
          (v): v is number => v !== null,
        )
        const lastActiveDate =
          candidates.length > 0 ? new Date(Math.max(...candidates)).toISOString() : null

        // needsAttention
        const registeredMoreThan7Days = new Date(s.user.createdAt) < sevenDaysAgo
        const noRecentSession = !lastSessionDate || new Date(lastSessionDate) < fourteenDaysAgo
        const neverBooked = totalSessions === 0 && registeredMoreThan7Days
        const lowConfidenceInactive = currentConfidence !== null && currentConfidence < 5 && noRecentSession
        const needsAttention = neverBooked || lowConfidenceInactive
        let attentionReason: string | null = null
        if (neverBooked) attentionReason = 'No sessions booked since registering over a week ago'
        else if (lowConfidenceInactive) attentionReason = `Confidence at ${currentConfidence}/10 with no session in the last 14 days`

        return {
          id: s.id,
          firstName: s.firstName,
          lastName: s.lastName,
          level: s.level,
          schoolYear: s.schoolYear,
          combination: s.combination ?? null,
          combinationsConsidering: s.combinationsConsidering,
          confidenceLevel: s.confidenceLevel ?? null,
          joinedAt: s.user.createdAt,
          mentorEnrolled: mentorSessions.length,
          mentorCompleted: completedMentorSessions.length,
          groupEnrolled: activeGroupEnrolments.length,
          groupCompleted: pastGroupEnrolments.length,
          initialConfidence: s.confidenceLogs[0]?.score ?? null,
          professionals: Array.from(profMap.entries()).map(([name, sector]) => ({ name, sector })),
          // engagement fields
          totalSessions,
          lastSessionDate,
          baselineConfidence,
          currentConfidence,
          confidenceDelta,
          lastActiveDate,
          needsAttention,
          attentionReason,
        }
      }),
    })
  } catch (err) {
    badRequest(res, err instanceof Error ? err.message : 'Failed')
  }
}

export const getStudentDetail = async (req: Request, res: Response): Promise<void> => {
  try {
    const careerGuide = await prisma.careerGuide.findUnique({
      where: { userId: req.auth!.userId },
    })

    if (!careerGuide?.schoolId) {
      badRequest(res, 'No school assigned')
      return
    }

    const { studentId } = req.params

    const student = await prisma.student.findFirst({
      where: { id: studentId, schoolId: careerGuide.schoolId },
      include: {
        user: { select: { createdAt: true } },
        sessions: {
          orderBy: { scheduledAt: 'desc' },
          select: {
            id: true,
            status: true,
            scheduledAt: true,
            type: true,
            professional: { select: { firstName: true, lastName: true } },
          },
        },
        groupEnrolments: {
          include: {
            groupSession: {
              select: {
                id: true,
                scheduledAt: true,
                isCancelled: true,
                title: true,
                professional: { select: { firstName: true, lastName: true } },
              },
            },
          },
          orderBy: { joinedAt: 'desc' },
        },
        confidenceLogs: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            score: true,
            note: true,
            combination: true,
            sessionId: true,
            changedThinking: true,
            createdAt: true,
          },
        },
      },
    })

    if (!student) {
      badRequest(res, 'Student not found')
      return
    }

    const mentorHistory = student.sessions
      .filter((s) => s.status !== 'CANCELLED')
      .map((s) => ({
        id: s.id,
        type: '1-on-1' as const,
        sessionType: s.type,
        date: s.scheduledAt,
        status: s.status,
        professionalName: `${s.professional.firstName} ${s.professional.lastName}`,
      }))

    const groupHistory = student.groupEnrolments
      .filter((e) => !e.groupSession.isCancelled)
      .map((e) => ({
        id: e.groupSession.id,
        type: 'Group' as const,
        sessionType: null,
        date: e.groupSession.scheduledAt,
        status: new Date(e.groupSession.scheduledAt) < new Date() ? 'COMPLETED' : 'UPCOMING',
        professionalName: `${e.groupSession.professional.firstName} ${e.groupSession.professional.lastName}`,
        title: e.groupSession.title,
      }))

    const sessionHistory = [...mentorHistory, ...groupHistory].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    )

    ok(res, {
      id: student.id,
      firstName: student.firstName,
      lastName: student.lastName,
      level: student.level,
      schoolYear: student.schoolYear,
      combinationsConsidering: student.combinationsConsidering,
      joinedAt: student.user.createdAt,
      sessionHistory,
      confidenceLogs: student.confidenceLogs,
    })
  } catch (err) {
    badRequest(res, err instanceof Error ? err.message : 'Failed')
  }
}

export const reapplyVerification = async (req: Request, res: Response): Promise<void> => {
  try {
    const guide = await prisma.careerGuide.findUnique({ where: { userId: req.auth!.userId } })
    if (!guide) { badRequest(res, 'Not found'); return }
    if (guide.verificationStatus === 'REJECTED') {
      res.status(403).json({ success: false, error: 'Your application was declined and cannot be resubmitted.' })
      return
    }
    if (guide.verificationAttempts >= 3) {
      res.status(403).json({ success: false, error: 'You have reached the maximum number of verification submissions (3).' })
      return
    }
    const { linkedinUrl } = req.body as { linkedinUrl?: string }
    await prisma.careerGuide.update({
      where: { id: guide.id },
      data: {
        verificationStatus: 'PENDING',
        verificationAttempts: { increment: 1 },
        ...(linkedinUrl === undefined ? {} : { linkedinUrl }),
      },
    })
    ok(res, { reapplied: true })
  } catch (err) {
    badRequest(res, err instanceof Error ? err.message : 'Failed')
  }
}
