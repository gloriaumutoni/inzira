import { Router } from 'express'
import * as googleCalendarController from '../controllers/googleCalendar.controller'
import { authMiddleware, roleGuard } from '../middleware'

const router = Router()

router.get('/auth', authMiddleware, roleGuard('PROFESSIONAL'), googleCalendarController.getAuthUrl)
router.get('/callback', googleCalendarController.handleCallback)
router.get('/slots/:professionalId', authMiddleware, googleCalendarController.getAvailableSlots)
router.delete('/disconnect', authMiddleware, roleGuard('PROFESSIONAL'), googleCalendarController.disconnect)

export default router
