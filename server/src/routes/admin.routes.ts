import { Router } from 'express'
import * as adminController from '../controllers/admin.controller'
import { authMiddleware, roleGuard } from '../middleware'

const router = Router()

router.use(authMiddleware, roleGuard('ADMIN'))

router.get('/stats', adminController.getStats)
router.get('/verification/professionals', adminController.getPendingProfessionals)
router.patch('/verification/professionals/:id/approve', adminController.approveProfessional)
router.patch('/verification/professionals/:id/reject', adminController.rejectProfessional)
router.patch('/professionals/:id/suspend', adminController.suspendProfessional)
router.patch('/professionals/:id/reinstate', adminController.reinstateProfessional)
router.patch('/professionals/:id/quota', adminController.updateQuota)
router.get('/verification/mentors', adminController.getPendingMentorApplications)
router.patch('/verification/mentors/:id/approve', adminController.approveMentorApplication)
router.patch('/verification/mentors/:id/reject', adminController.rejectMentorApplication)
router.patch('/verification/mentors/:id/interviewed', adminController.markMentorInterviewed)
router.get('/verification/career-guides', adminController.getPendingCareerGuides)
router.patch('/verification/career-guides/:id/approve', adminController.approveCareerGuide)
router.patch('/verification/career-guides/:id/reject', adminController.rejectCareerGuide)
router.get('/interview-slots', adminController.getAdminInterviewSlots)
router.post('/interview-slots', adminController.createAdminInterviewSlot)
router.delete('/interview-slots/:id', adminController.deleteAdminInterviewSlot)

export default router
