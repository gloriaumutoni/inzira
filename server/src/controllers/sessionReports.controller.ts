import { Request, Response } from 'express'
import { SessionReportReason, SessionReportStatus } from '@prisma/client'
import * as sessionReportsService from '../services/sessionReports.service'
import { created, ok, badRequest } from '../utils/response'

export const reportSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const { reason, description } = req.body
    created(res, await sessionReportsService.reportSession(
      req.auth!.userId,
      req.params.id,
      reason as SessionReportReason,
      description
    ))
  } catch (err) {
    badRequest(res, err instanceof Error ? err.message : 'Failed')
  }
}

export const reportGroupSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const { reason, description } = req.body
    created(res, await sessionReportsService.reportGroupSession(
      req.auth!.userId,
      req.params.id,
      reason as SessionReportReason,
      description
    ))
  } catch (err) {
    badRequest(res, err instanceof Error ? err.message : 'Failed')
  }
}

export const adminList = async (req: Request, res: Response): Promise<void> => {
  try {
    ok(res, await sessionReportsService.adminListReports(req.query.status as string | undefined))
  } catch (err) {
    badRequest(res, err instanceof Error ? err.message : 'Failed')
  }
}

export const adminUpdate = async (req: Request, res: Response): Promise<void> => {
  try {
    ok(res, await sessionReportsService.adminUpdateReport(
      req.params.id,
      req.body.status as SessionReportStatus
    ))
  } catch (err) {
    badRequest(res, err instanceof Error ? err.message : 'Failed')
  }
}
