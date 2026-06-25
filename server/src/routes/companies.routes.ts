import { Router } from 'express'
import * as companiesController from '../controllers/companies.controller'
import { authMiddleware, roleGuard } from '../middleware'

const router = Router()

router.use(authMiddleware, roleGuard('COMPANY'))

router.get('/me', companiesController.getMe)
router.patch('/me', companiesController.updateMe)
router.get('/me/dashboard', companiesController.getDashboard)

export default router
