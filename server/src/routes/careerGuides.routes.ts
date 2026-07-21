import { Router } from 'express'
import * as careerGuidesController from '../controllers/careerGuides.controller'
import { authMiddleware, roleGuard, cacheMiddleware } from '../middleware'

const router = Router()

router.use(authMiddleware, roleGuard('CAREER_GUIDE'))

router.get('/me', cacheMiddleware(20), careerGuidesController.getMe)
router.get('/me/dashboard', cacheMiddleware(20), careerGuidesController.getDashboard)
router.get('/me/students', cacheMiddleware(20), careerGuidesController.getMySchoolStudents)
router.get('/me/students/:studentId', cacheMiddleware(20), careerGuidesController.getStudentDetail)
router.get('/me/cohort-quiz-summary', cacheMiddleware(30), careerGuidesController.getCohortQuizSummary)
router.get('/me/impact', cacheMiddleware(60), careerGuidesController.getImpact)
router.post('/me/reapply', careerGuidesController.reapplyVerification)

export default router
