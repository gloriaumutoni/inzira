import { Router } from 'express'
import authRouter from './auth.routes'
import studentsRouter from './students.routes'
import professionalsRouter from './professionals.routes'
import companiesRouter from './companies.routes'
import careerGuidesRouter from './careerGuides.routes'

const router = Router()

router.use('/auth', authRouter)
router.use('/students', studentsRouter)
router.use('/professionals', professionalsRouter)
router.use('/companies', companiesRouter)
router.use('/career-guides', careerGuidesRouter)

export default router
