import { Router } from 'express'
import authRouter from './auth.routes'
import studentsRouter from './students.routes'
import professionalsRouter from './professionals.routes'
import companiesRouter from './companies.routes'
import careerGuidesRouter from './careerGuides.routes'
import careersRouter from './careers.routes'
import schoolsRouter from './schools.routes'

const router = Router()

router.use('/auth', authRouter)
router.use('/students', studentsRouter)
router.use('/professionals', professionalsRouter)
router.use('/companies', companiesRouter)
router.use('/career-guides', careerGuidesRouter)
router.use('/careers', careersRouter)
router.use('/schools', schoolsRouter)

export default router
