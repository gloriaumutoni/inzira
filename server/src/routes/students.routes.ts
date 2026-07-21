import { Router } from 'express'
import * as studentsController from '../controllers/students.controller'
import { authMiddleware, roleGuard, cacheMiddleware } from '../middleware'

const router = Router()

router.use(authMiddleware, roleGuard('STUDENT'))

router.get('/me', cacheMiddleware(20), studentsController.getMe)
router.patch('/me', studentsController.updateMe)
router.get('/me/dashboard', cacheMiddleware(20), studentsController.getDashboard)
router.post('/me/confidence', studentsController.logConfidence)
router.get('/me/confidence', cacheMiddleware(20), studentsController.getConfidenceLogs)
router.post('/me/quiz-result', studentsController.saveQuizResult)
router.patch('/me/pathway', studentsController.savePathway)
router.get('/stream-supply', cacheMiddleware(120), studentsController.getStreamSupply)
router.get('/me/group-sessions', cacheMiddleware(20), studentsController.getGroupSessions)
router.get('/me/mentor-slots', cacheMiddleware(20), studentsController.getBookedMentorSlots)
router.get('/me/pending-reflections', cacheMiddleware(15), studentsController.getPendingReflections)

export default router
