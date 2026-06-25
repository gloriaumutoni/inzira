import { Request, Response } from 'express'
import * as paymentsService from '../services/payments.service'
import { ok, created, badRequest } from '../utils/response'

export const initiate = async (req: Request, res: Response): Promise<void> => {
  try {
    created(res, await paymentsService.initiate(req.body))
  } catch (err) {
    badRequest(res, err instanceof Error ? err.message : 'Failed')
  }
}

export const checkStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    ok(res, await paymentsService.checkStatus(req.params.reference))
  } catch (err) {
    badRequest(res, err instanceof Error ? err.message : 'Failed')
  }
}

export const getMyPayments = async (req: Request, res: Response): Promise<void> => {
  try {
    ok(res, await paymentsService.getMyPayments(req.auth!.userId))
  } catch (err) {
    badRequest(res, err instanceof Error ? err.message : 'Failed')
  }
}

export const getProfessionalEarnings = async (req: Request, res: Response): Promise<void> => {
  try {
    ok(res, await paymentsService.getProfessionalEarnings(
      req.auth!.userId, req.query.month as string
    ))
  } catch (err) {
    badRequest(res, err instanceof Error ? err.message : 'Failed')
  }
}

export const requestPayout = async (req: Request, res: Response): Promise<void> => {
  try {
    ok(res, await paymentsService.requestPayout(req.auth!.userId, req.body.amount))
  } catch (err) {
    badRequest(res, err instanceof Error ? err.message : 'Failed')
  }
}
