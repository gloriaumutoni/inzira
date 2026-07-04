import { Router } from 'express'
import * as professionalsController from '../controllers/professionals.controller'
import { authMiddleware, roleGuard } from '../middleware'

const router = Router()

// /me routes must come before /:id to prevent Express matching "me" as an id
router.get('/me', authMiddleware, roleGuard('PROFESSIONAL'), professionalsController.getMe)
router.patch('/me', authMiddleware, roleGuard('PROFESSIONAL'), professionalsController.updateMe)
router.patch('/me/tiers', authMiddleware, roleGuard('PROFESSIONAL'), professionalsController.updateTiers)
router.get('/me/availability', authMiddleware, roleGuard('PROFESSIONAL'), professionalsController.getAvailability)
router.post('/me/availability', authMiddleware, roleGuard('PROFESSIONAL'), professionalsController.saveAvailability)
router.get('/me/dashboard', authMiddleware, roleGuard('PROFESSIONAL'), professionalsController.getDashboard)
router.get('/me/quota', authMiddleware, roleGuard('PROFESSIONAL'), professionalsController.getQuota)
router.post('/me/apply-mentor', authMiddleware, roleGuard('PROFESSIONAL'), professionalsController.applyToBeMentor)
router.post('/me/reapply', authMiddleware, roleGuard('PROFESSIONAL'), professionalsController.reapplyVerification)
router.get('/me/mentor-slots', authMiddleware, roleGuard('PROFESSIONAL'), professionalsController.getMentorSlots)
router.post('/me/mentor-slots', authMiddleware, roleGuard('PROFESSIONAL'), professionalsController.createMentorSlot)
router.put('/me/mentor-slots/:slotId', authMiddleware, roleGuard('PROFESSIONAL'), professionalsController.updateMentorSlot)
router.delete('/me/mentor-slots/:slotId', authMiddleware, roleGuard('PROFESSIONAL'), professionalsController.deleteMentorSlot)

router.get('/mentors', authMiddleware, professionalsController.getApprovedMentors)
router.get('/', authMiddleware, professionalsController.browse)
router.get('/:id/slots', authMiddleware, professionalsController.getPublicMentorSlots)
router.get('/:id', authMiddleware, professionalsController.getPublicProfile)

export default router
