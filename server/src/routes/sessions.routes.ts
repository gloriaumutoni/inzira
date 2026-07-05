import { Router } from 'express'
import * as sessionsController from '../controllers/sessions.controller'
import * as sessionReportsController from '../controllers/sessionReports.controller'
import { authMiddleware, roleGuard, cacheMiddleware } from '../middleware'

const router = Router()

router.get(
  '/',
  authMiddleware,
  roleGuard('STUDENT', 'PROFESSIONAL'),
  cacheMiddleware(15),
  sessionsController.list
)

router.post(
  '/',
  authMiddleware,
  roleGuard('STUDENT'),
  sessionsController.create
)

router.get(
  '/:id',
  authMiddleware,
  roleGuard('STUDENT', 'PROFESSIONAL', 'ADMIN'),
  cacheMiddleware(15),
  sessionsController.getOne
)

router.patch(
  '/:id/confirm',
  authMiddleware,
  roleGuard('PROFESSIONAL'),
  sessionsController.confirm
)

router.patch(
  '/:id/decline',
  authMiddleware,
  roleGuard('PROFESSIONAL'),
  sessionsController.decline
)

router.patch(
  '/:id/cancel',
  authMiddleware,
  roleGuard('STUDENT', 'PROFESSIONAL'),
  sessionsController.cancel
)

router.patch(
  '/:id/complete',
  authMiddleware,
  roleGuard('PROFESSIONAL'),
  sessionsController.complete
)

router.patch(
  '/:id/notes',
  authMiddleware,
  roleGuard('PROFESSIONAL'),
  sessionsController.saveNotes
)

router.post(
  '/:id/review',
  authMiddleware,
  roleGuard('STUDENT'),
  sessionsController.submitReview
)

router.post(
  '/:id/report',
  authMiddleware,
  roleGuard('STUDENT'),
  sessionReportsController.reportSession
)

export default router
