import { Request, Response } from 'express'
import * as studentsService from '../services/students.service'
import { ok, badRequest } from '../utils/response'

export const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    const data = await studentsService.getMe(req.auth!.userId)
    ok(res, data)
  } catch (err) {
    badRequest(res, err instanceof Error ? err.message : 'Failed')
  }
}

export const updateMe = async (req: Request, res: Response): Promise<void> => {
  try {
    const data = await studentsService.updateMe(req.auth!.userId, req.body)
    ok(res, data)
  } catch (err) {
    badRequest(res, err instanceof Error ? err.message : 'Failed')
  }
}

export const getDashboard = async (req: Request, res: Response): Promise<void> => {
  try {
    const data = await studentsService.getDashboard(req.auth!.userId)
    ok(res, data)
  } catch (err) {
    badRequest(res, err instanceof Error ? err.message : 'Failed')
  }
}

export const logConfidence = async (req: Request, res: Response): Promise<void> => {
  try {
    const { score, note, combination, sessionId, changedThinking, streamCode } = req.body
    const data = await studentsService.logConfidence(
      req.auth!.userId, score, note, combination, sessionId, changedThinking, streamCode
    )
    ok(res, data)
  } catch (err) {
    badRequest(res, err instanceof Error ? err.message : 'Failed')
  }
}

export const saveQuizResult = async (req: Request, res: Response): Promise<void> => {
  try {
    const { answers, scores, topPathways } = req.body
    if (!Array.isArray(topPathways) || topPathways.length === 0) {
      badRequest(res, 'topPathways required'); return
    }
    const data = await studentsService.saveQuizResult(req.auth!.userId, { answers, scores, topPathways })
    ok(res, data)
  } catch (err) {
    badRequest(res, err instanceof Error ? err.message : 'Failed')
  }
}

export const savePathway = async (req: Request, res: Response): Promise<void> => {
  try {
    const { pathway } = req.body
    if (!pathway || typeof pathway !== 'string') {
      badRequest(res, 'pathway required'); return
    }
    ok(res, await studentsService.savePathway(req.auth!.userId, pathway))
  } catch (err) {
    badRequest(res, err instanceof Error ? err.message : 'Failed')
  }
}

export const getStreamSupply = async (_req: Request, res: Response): Promise<void> => {
  try {
    const data = await studentsService.getStreamSupply()
    ok(res, data)
  } catch (err) {
    badRequest(res, err instanceof Error ? err.message : 'Failed')
  }
}

export const getConfidenceLogs = async (req: Request, res: Response): Promise<void> => {
  try {
    const data = await studentsService.getConfidenceLogs(req.auth!.userId)
    ok(res, data)
  } catch (err) {
    badRequest(res, err instanceof Error ? err.message : 'Failed')
  }
}

export const getPendingReflections = async (req: Request, res: Response): Promise<void> => {
  try {
    const data = await studentsService.getPendingReflections(req.auth!.userId)
    ok(res, data)
  } catch (err) {
    badRequest(res, err instanceof Error ? err.message : 'Failed')
  }
}

export const getGroupSessions = async (req: Request, res: Response): Promise<void> => {
  try {
    const enrolments = await studentsService.getGroupSessions(req.auth!.userId)
    ok(res, { enrolments })
  } catch (err) {
    badRequest(res, err instanceof Error ? err.message : 'Failed')
  }
}

export const getBookedMentorSlots = async (req: Request, res: Response): Promise<void> => {
  try {
    const { prisma } = await import('../prisma/client')
    const student = await prisma.student.findUnique({ where: { userId: req.auth!.userId } })
    if (!student) { badRequest(res, 'Student not found'); return }
    const slots = await prisma.mentorSlot.findMany({
      where: { bookedByStudentId: student.id, scheduledAt: { gt: new Date() } },
      include: {
        Professional: {
          select: { id: true, firstName: true, lastName: true, jobTitle: true },
        },
      },
      orderBy: { scheduledAt: 'asc' },
    })
    ok(res, { slots })
  } catch (err) {
    badRequest(res, err instanceof Error ? err.message : 'Failed')
  }
}
