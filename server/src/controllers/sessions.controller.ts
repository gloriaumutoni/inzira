import { Request, Response } from 'express'
import * as sessionsService from '../services/sessions.service'
import { ok, created, badRequest } from '../utils/response'
import { prisma } from '../prisma/client'

export const list = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, type, page, limit } = req.query
    ok(res, await sessionsService.list(req.auth!.userId, req.auth!.role, {
      status: status as string,
      type: type as string,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    }))
  } catch (err) {
    badRequest(res, err instanceof Error ? err.message : 'Failed')
  }
}

export const create = async (req: Request, res: Response): Promise<void> => {
  try {
    created(res, await sessionsService.create(req.auth!.userId, req.body))
  } catch (err) {
    badRequest(res, err instanceof Error ? err.message : 'Failed')
  }
}

export const getOne = async (req: Request, res: Response): Promise<void> => {
  try {
    ok(res, await sessionsService.getOne(req.params.id, req.auth!.userId, req.auth!.role))
  } catch (err) {
    badRequest(res, err instanceof Error ? err.message : 'Failed')
  }
}

export const confirm = async (req: Request, res: Response): Promise<void> => {
  try {
    ok(res, await sessionsService.confirm(req.params.id, req.auth!.userId))
  } catch (err) {
    badRequest(res, err instanceof Error ? err.message : 'Failed')
  }
}

export const decline = async (req: Request, res: Response): Promise<void> => {
  try {
    ok(res, await sessionsService.decline(req.params.id, req.auth!.userId, req.body.reason))
  } catch (err) {
    badRequest(res, err instanceof Error ? err.message : 'Failed')
  }
}

export const cancel = async (req: Request, res: Response): Promise<void> => {
  try {
    ok(res, await sessionsService.cancel(
      req.params.id, req.auth!.userId, req.auth!.role, req.body.reason
    ))
  } catch (err) {
    badRequest(res, err instanceof Error ? err.message : 'Failed')
  }
}

export const complete = async (req: Request, res: Response): Promise<void> => {
  try {
    ok(res, await sessionsService.complete(req.params.id, req.auth!.userId))
  } catch (err) {
    badRequest(res, err instanceof Error ? err.message : 'Failed')
  }
}

export const saveNotes = async (req: Request, res: Response): Promise<void> => {
  try {
    ok(res, await sessionsService.saveNotes(req.params.id, req.auth!.userId, req.body.notes))
  } catch (err) {
    badRequest(res, err instanceof Error ? err.message : 'Failed')
  }
}

export const submitReview = async (req: Request, res: Response): Promise<void> => {
  try {
    const { rating, comment } = req.body
    created(res, await sessionsService.submitReview(
      req.params.id, req.auth!.userId, rating, comment
    ))
  } catch (err) {
    badRequest(res, err instanceof Error ? err.message : 'Failed')
  }
}

export const submitFeedback = async (req: Request, res: Response): Promise<void> => {
  try {
    const { confidenceBefore, confidenceAfter, wasHelpful, professionalFeedback } = req.body
    created(res, await sessionsService.submitFeedback(
      req.params.id,
      req.auth!.userId,
      { confidenceBefore, confidenceAfter, wasHelpful, professionalFeedback }
    ))
  } catch (err) {
    badRequest(res, err instanceof Error ? err.message : 'Failed')
  }
}

export const bookMentorSlot = async (req: Request, res: Response): Promise<void> => {
  try {
    const { professionalId, scheduledAt } = req.body as {
      professionalId: string
      scheduledAt: string
    }

    const student = await prisma.student.findUnique({ where: { userId: req.auth!.userId } })
    const professional = await prisma.professional.findUnique({ where: { id: professionalId } })

    if (!professional?.isMentor) {
      res.status(403).json({ success: false, error: 'This professional is not a mentor.' })
      return
    }

    const existing = await prisma.mentorSlot.findFirst({
      where: { professionalId, scheduledAt: new Date(scheduledAt), isBooked: true },
    })
    if (existing) {
      res.status(409).json({ success: false, error: 'This slot was just taken. Please pick another.' })
      return
    }

    const slot = await prisma.mentorSlot.upsert({
      where: {
        professionalId_scheduledAt: {
          professionalId,
          scheduledAt: new Date(scheduledAt),
        },
      },
      update: { isBooked: true, bookedByStudentId: student!.id },
      create: {
        id: crypto.randomUUID(),
        professionalId,
        scheduledAt: new Date(scheduledAt),
        durationMins: 30,
        isBooked: true,
        bookedByStudentId: student!.id,
      },
    })

    const session = await prisma.session.create({
      data: {
        studentId: student!.id,
        professionalId,
        type: 'FREE_INTRO',
        status: 'CONFIRMED',
        scheduledAt: new Date(scheduledAt),
        duration: 30,
      },
    })

    await prisma.mentorSlot.update({
      where: { id: slot.id },
      data: { sessionId: session.id },
    })

    ok(res, { ...session, meetLink: slot.meetLink ?? null })
  } catch (err) {
    badRequest(res, err instanceof Error ? err.message : 'Failed')
  }
}
