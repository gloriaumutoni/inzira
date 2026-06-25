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
    const { score, note } = req.body
    const data = await studentsService.logConfidence(req.auth!.userId, score, note)
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
