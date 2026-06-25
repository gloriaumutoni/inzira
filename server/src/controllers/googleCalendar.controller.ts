import { Request, Response } from 'express'
import * as googleCalendarService from '../services/googleCalendar.service'
import { prisma } from '../prisma/client'
import { ok, badRequest } from '../utils/response'

export const getAuthUrl = async (req: Request, res: Response): Promise<void> => {
  try {
    const professional = await prisma.professional.findUnique({
      where: { userId: req.auth!.userId },
    })
    if (!professional) {
      badRequest(res, 'Professional not found')
      return
    }
    const url = googleCalendarService.getAuthUrl(professional.id)
    ok(res, { url })
  } catch (err) {
    badRequest(res, err instanceof Error ? err.message : 'Failed')
  }
}

export const handleCallback = async (req: Request, res: Response): Promise<void> => {
  try {
    const { code, state } = req.query
    await googleCalendarService.handleCallback(code as string, state as string)
    res.redirect(`${process.env.CORS_ORIGIN}/professional/profile?connected=true`)
  } catch {
    res.redirect(`${process.env.CORS_ORIGIN}/professional/profile?error=calendar_failed`)
  }
}

export const getAvailableSlots = async (req: Request, res: Response): Promise<void> => {
  try {
    ok(res, await googleCalendarService.getAvailableSlots(req.params.professionalId))
  } catch (err) {
    badRequest(res, err instanceof Error ? err.message : 'Failed')
  }
}

export const disconnect = async (req: Request, res: Response): Promise<void> => {
  try {
    ok(res, await googleCalendarService.disconnect(req.auth!.userId))
  } catch (err) {
    badRequest(res, err instanceof Error ? err.message : 'Failed')
  }
}
