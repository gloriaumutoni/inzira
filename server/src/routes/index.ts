import { Router } from 'express'
import authRouter from './auth.routes'
import studentsRouter from './students.routes'
import professionalsRouter from './professionals.routes'
import careerGuidesRouter from './careerGuides.routes'
import careersRouter from './careers.routes'
import schoolsRouter from './schools.routes'
import sessionsRouter from './sessions.routes'
import groupSessionsRouter from './groupSessions.routes'
import mentorshipsRouter from './mentorships.routes'
import notificationsRouter from './notifications.routes'
import adminRouter from './admin.routes'
import careerStoriesRouter from './careerStories.routes'
import * as adminController from '../controllers/admin.controller'
import { authMiddleware } from '../middleware'

const router = Router()

router.get('/stats', adminController.getPublicStats)

router.use('/auth', authRouter)
router.use('/students', studentsRouter)
router.use('/professionals', professionalsRouter)
router.use('/career-guides', careerGuidesRouter)
router.use('/careers', careersRouter)
router.use('/schools', schoolsRouter)
router.use('/sessions', sessionsRouter)
router.use('/group-sessions', groupSessionsRouter)
router.use('/mentorships', mentorshipsRouter)
router.use('/notifications', notificationsRouter)
router.use('/admin', adminRouter)
router.use('/career-stories', careerStoriesRouter)
router.get('/interview-slots/available', authMiddleware, adminController.getAvailableInterviewSlots)

export default router
