import { Router } from 'express'
import * as adminController from '../controllers/admin.controller'
import * as careerStoriesController from '../controllers/careerStories.controller'
import * as sessionReportsController from '../controllers/sessionReports.controller'
import { authMiddleware, roleGuard } from '../middleware'

const router = Router()

router.use(authMiddleware, roleGuard('ADMIN'))

router.get('/stats', adminController.getStats)
router.get('/verification/professionals', adminController.getPendingProfessionals)
router.patch('/verification/professionals/:id/approve', adminController.approveProfessional)
router.patch('/verification/professionals/:id/reject', adminController.rejectProfessional)
router.get('/verification/career-guides', adminController.getPendingCareerGuides)
router.patch('/verification/career-guides/:id/approve', adminController.approveCareerGuide)
router.patch('/verification/career-guides/:id/reject', adminController.rejectCareerGuide)
router.get('/verification/mentors', adminController.getPendingMentorApplications)
router.patch('/verification/mentors/:id/approve', adminController.approveMentorApplication)
router.patch('/verification/mentors/:id/reject', adminController.rejectMentorApplication)
router.patch('/professionals/:id/suspend', adminController.suspendProfessional)
router.patch('/professionals/:id/reinstate', adminController.reinstateProfessional)
router.patch('/professionals/:id/quota', adminController.updateQuota)
router.get('/interview-slots', adminController.getAdminInterviewSlots)
router.post('/interview-slots', adminController.createAdminInterviewSlot)
router.put('/interview-slots/:id', adminController.updateAdminInterviewSlot)
router.delete('/interview-slots/:id', adminController.deleteAdminInterviewSlot)

router.get('/reports/students', adminController.getReportStudents)
router.get('/reports/professionals', adminController.getReportProfessionals)
router.get('/reports/career-guides', adminController.getReportCareerGuides)
router.get('/reports/summary', adminController.getReportSummary)

router.get('/career-stories', careerStoriesController.adminList)
router.post('/career-stories', careerStoriesController.adminCreate)
router.get('/career-stories/professionals/verified', careerStoriesController.adminListVerifiedProfessionals)
router.patch('/career-stories/:id/approve', careerStoriesController.adminApprove)
router.patch('/career-stories/:id/reject', careerStoriesController.adminReject)
router.patch('/career-stories/:id/unpublish', careerStoriesController.adminUnpublish)

router.get('/session-reports', sessionReportsController.adminList)
router.patch('/session-reports/:id', sessionReportsController.adminUpdate)

export default router
