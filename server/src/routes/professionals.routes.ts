import { Router } from 'express'
import * as professionalsController from '../controllers/professionals.controller'
import { authMiddleware, roleGuard, cacheMiddleware } from '../middleware'

const router = Router()

// /me routes must come before /:id to prevent Express matching "me" as an id
router.get('/me', authMiddleware, roleGuard('PROFESSIONAL'), cacheMiddleware(20), professionalsController.getMe)
router.patch('/me', authMiddleware, roleGuard('PROFESSIONAL'), professionalsController.updateMe)
router.patch('/me/tiers', authMiddleware, roleGuard('PROFESSIONAL'), professionalsController.updateTiers)
router.get('/me/availability', authMiddleware, roleGuard('PROFESSIONAL'), cacheMiddleware(20), professionalsController.getAvailability)
router.post('/me/availability', authMiddleware, roleGuard('PROFESSIONAL'), professionalsController.saveAvailability)
router.get('/me/dashboard', authMiddleware, roleGuard('PROFESSIONAL'), cacheMiddleware(20), professionalsController.getDashboard)
router.get('/me/quota', authMiddleware, roleGuard('PROFESSIONAL'), cacheMiddleware(15), professionalsController.getQuota)
router.post('/me/apply-mentor', authMiddleware, roleGuard('PROFESSIONAL'), professionalsController.applyToBeMentor)
router.post('/me/reapply', authMiddleware, roleGuard('PROFESSIONAL'), professionalsController.reapplyVerification)
router.get('/me/mentor-slots', authMiddleware, roleGuard('PROFESSIONAL'), cacheMiddleware(15), professionalsController.getMentorSlots)
router.post('/me/mentor-slots', authMiddleware, roleGuard('PROFESSIONAL'), professionalsController.createMentorSlot)
router.post('/me/mentor-slots/recurring', authMiddleware, roleGuard('PROFESSIONAL'), professionalsController.createRecurringMentorSlots)
router.put('/me/mentor-slots/:slotId', authMiddleware, roleGuard('PROFESSIONAL'), professionalsController.updateMentorSlot)
router.delete('/me/mentor-slots/:slotId', authMiddleware, roleGuard('PROFESSIONAL'), professionalsController.deleteMentorSlot)

router.get('/mentors', authMiddleware, cacheMiddleware(60), professionalsController.getApprovedMentors)
router.get('/', authMiddleware, cacheMiddleware(60), professionalsController.browse)
router.get('/:id/slots', authMiddleware, cacheMiddleware(15), professionalsController.getPublicMentorSlots)
router.get('/:id', authMiddleware, cacheMiddleware(60), professionalsController.getPublicProfile)

export default router
