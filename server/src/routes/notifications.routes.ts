import { Router } from 'express'
import * as notificationsController from '../controllers/notifications.controller'
import { authMiddleware, cacheMiddleware } from '../middleware'

const router = Router()

router.use(authMiddleware)

// /read-all must come before /:id/read to avoid ambiguity
router.patch('/read-all', notificationsController.markAllRead)
router.get('/', cacheMiddleware(10), notificationsController.list)
router.patch('/:id/read', notificationsController.markRead)

export default router
