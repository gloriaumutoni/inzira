import { Router } from 'express'
import * as adminController from '../controllers/admin.controller'
import * as careerStoriesController from '../controllers/careerStories.controller'
import * as sessionReportsController from '../controllers/sessionReports.controller'
import { authMiddleware, roleGuard, cacheMiddleware } from '../middleware'

const router = Router()

router.use(authMiddleware, roleGuard('ADMIN'))

router.get('/stats', cacheMiddleware(30), adminController.getStats)
router.get('/verification/professionals', cacheMiddleware(15), adminController.getPendingProfessionals)
router.patch('/verification/professionals/:id/approve', adminController.approveProfessional)
router.patch('/verification/professionals/:id/reject', adminController.rejectProfessional)
router.get('/verification/career-guides', cacheMiddleware(15), adminController.getPendingCareerGuides)
router.patch('/verification/career-guides/:id/approve', adminController.approveCareerGuide)
router.patch('/verification/career-guides/:id/reject', adminController.rejectCareerGuide)
router.get('/verification/mentors', cacheMiddleware(15), adminController.getPendingMentorApplications)
router.patch('/verification/mentors/:id/approve', adminController.approveMentorApplication)
router.patch('/verification/mentors/:id/reject', adminController.rejectMentorApplication)
router.patch('/professionals/:id/suspend', adminController.suspendProfessional)
router.patch('/professionals/:id/reinstate', adminController.reinstateProfessional)
router.patch('/professionals/:id/quota', adminController.updateQuota)
router.get('/interview-slots', cacheMiddleware(20), adminController.getAdminInterviewSlots)
router.post('/interview-slots', adminController.createAdminInterviewSlot)
router.put('/interview-slots/:id', adminController.updateAdminInterviewSlot)
router.delete('/interview-slots/:id', adminController.deleteAdminInterviewSlot)

router.get('/reports/students', cacheMiddleware(60), adminController.getReportStudents)
router.get('/reports/professionals', cacheMiddleware(60), adminController.getReportProfessionals)
router.get('/reports/career-guides', cacheMiddleware(60), adminController.getReportCareerGuides)
router.get('/reports/summary', cacheMiddleware(60), adminController.getReportSummary)

router.get('/career-stories', cacheMiddleware(20), careerStoriesController.adminList)
router.post('/career-stories', careerStoriesController.adminCreate)
router.get('/career-stories/professionals/verified', cacheMiddleware(30), careerStoriesController.adminListVerifiedProfessionals)
router.patch('/career-stories/:id/approve', careerStoriesController.adminApprove)
router.patch('/career-stories/:id/reject', careerStoriesController.adminReject)
router.patch('/career-stories/:id/unpublish', careerStoriesController.adminUnpublish)

router.get('/session-reports', cacheMiddleware(20), sessionReportsController.adminList)
router.patch('/session-reports/:id', sessionReportsController.adminUpdate)

router.get('/coverage', cacheMiddleware(60), adminController.getCoverage)
router.get('/impact', cacheMiddleware(60), adminController.getAdminImpact)

export default router
