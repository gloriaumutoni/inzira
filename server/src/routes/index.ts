import { Router } from 'express'
import { getPublicStats } from '../controllers/stats.controller'
import authRouter from './auth.routes'
import studentsRouter from './students.routes'
import professionalsRouter from './professionals.routes'
import companiesRouter from './companies.routes'
import careerGuidesRouter from './careerGuides.routes'
import careersRouter from './careers.routes'
import schoolsRouter from './schools.routes'
import sessionsRouter from './sessions.routes'
import groupSessionsRouter from './groupSessions.routes'
import workshopsRouter from './workshops.routes'
import mentorshipsRouter from './mentorships.routes'
import paymentsRouter from './payments.routes'
import notificationsRouter from './notifications.routes'
import googleCalendarRouter from './googleCalendar.routes'
import adminRouter from './admin.routes'

const router = Router()

router.get('/stats', getPublicStats)
router.use('/auth', authRouter)
router.use('/students', studentsRouter)
router.use('/professionals', professionalsRouter)
router.use('/companies', companiesRouter)
router.use('/career-guides', careerGuidesRouter)
router.use('/careers', careersRouter)
router.use('/schools', schoolsRouter)
router.use('/sessions', sessionsRouter)
router.use('/group-sessions', groupSessionsRouter)
router.use('/workshops', workshopsRouter)
router.use('/mentorships', mentorshipsRouter)
router.use('/payments', paymentsRouter)
router.use('/notifications', notificationsRouter)
router.use('/google-calendar', googleCalendarRouter)
router.use('/admin', adminRouter)

export default router
