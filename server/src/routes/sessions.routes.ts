import { Router } from 'express'
import * as sessionsController from '../controllers/sessions.controller'
import { authMiddleware, roleGuard } from '../middleware'

const router = Router()

router.get(
  '/',
  authMiddleware,
  roleGuard('STUDENT', 'PROFESSIONAL'),
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
  '/:id/feedback',
  authMiddleware,
  roleGuard('STUDENT'),
  sessionsController.submitFeedback
)

export default router
