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
router.get('/me/availability-template', authMiddleware, roleGuard('PROFESSIONAL'), professionalsController.getMyAvailabilityTemplate)
router.post('/me/availability-template', authMiddleware, roleGuard('PROFESSIONAL'), professionalsController.addAvailabilityTemplate)
router.delete('/me/availability-template/:id', authMiddleware, roleGuard('PROFESSIONAL'), professionalsController.deleteAvailabilityTemplate)
router.get('/me/dashboard', authMiddleware, roleGuard('PROFESSIONAL'), professionalsController.getDashboard)
router.get('/me/quota', authMiddleware, roleGuard('PROFESSIONAL'), professionalsController.getQuota)
router.post('/me/apply-mentor', authMiddleware, roleGuard('PROFESSIONAL'), professionalsController.applyToBeMentor)
router.patch('/me/careers', authMiddleware, roleGuard('PROFESSIONAL'), professionalsController.updateMyCareers)

router.get('/', authMiddleware, professionalsController.browse)
router.get('/recommended', authMiddleware, roleGuard('STUDENT'), professionalsController.getRecommendedProfessionals)
router.get('/mentors', authMiddleware, professionalsController.getApprovedMentors)
router.get('/:id/slots', authMiddleware, professionalsController.getMentorOpenSlots)
router.get('/:id', authMiddleware, professionalsController.getPublicProfile)

export default router
