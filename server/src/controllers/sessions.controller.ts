import { Request, Response } from 'express'
import * as sessionsService from '../services/sessions.service'
import { ok, created, badRequest } from '../utils/response'

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
