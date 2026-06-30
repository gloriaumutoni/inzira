import { Router } from 'express'
import * as mentorSlotsController from '../controllers/mentor-slots.controller'
import { authMiddleware, roleGuard } from '../middleware'

const router = Router()

router.post('/', authMiddleware, roleGuard('PROFESSIONAL'), mentorSlotsController.createMentorSlot)
router.get('/me', authMiddleware, roleGuard('PROFESSIONAL'), mentorSlotsController.getMyMentorSlots)
router.delete('/:id', authMiddleware, roleGuard('PROFESSIONAL'), mentorSlotsController.deleteMentorSlot)
router.get('/:professionalId/available', authMiddleware, mentorSlotsController.getAvailableMentorSlots)

export default router
