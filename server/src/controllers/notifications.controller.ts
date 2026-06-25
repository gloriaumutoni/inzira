import { Request, Response } from 'express'
import * as notificationsService from '../services/notifications.service'
import { ok, badRequest } from '../utils/response'

export const list = async (req: Request, res: Response): Promise<void> => {
  try {
    ok(res, await notificationsService.list(req.auth!.userId))
  } catch (err) {
    badRequest(res, err instanceof Error ? err.message : 'Failed')
  }
}

export const markRead = async (req: Request, res: Response): Promise<void> => {
  try {
    ok(res, await notificationsService.markRead(req.params.id, req.auth!.userId))
  } catch (err) {
    badRequest(res, err instanceof Error ? err.message : 'Failed')
  }
}

export const markAllRead = async (req: Request, res: Response): Promise<void> => {
  try {
    ok(res, await notificationsService.markAllRead(req.auth!.userId))
  } catch (err) {
    badRequest(res, err instanceof Error ? err.message : 'Failed')
  }
}
