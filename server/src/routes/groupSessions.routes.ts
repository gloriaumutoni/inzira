import { Router } from "express";
import * as groupSessionsController from "../controllers/groupSessions.controller";
import * as sessionReportsController from "../controllers/sessionReports.controller";
import { authMiddleware, roleGuard, cacheMiddleware } from "../middleware";

const router = Router();

router.get(
  "/me",
  authMiddleware,
  roleGuard("PROFESSIONAL"),
  cacheMiddleware(20),
  groupSessionsController.getOwn,
);

router.get("/", authMiddleware, cacheMiddleware(15), groupSessionsController.list);
router.get("/:id", authMiddleware, cacheMiddleware(15), groupSessionsController.getOne);
router.post(
  "/",
  authMiddleware,
  roleGuard("PROFESSIONAL"),
  groupSessionsController.create,
);
router.patch(
  "/:id",
  authMiddleware,
  roleGuard("PROFESSIONAL"),
  groupSessionsController.update,
);
router.delete(
  "/:id",
  authMiddleware,
  roleGuard("PROFESSIONAL"),
  groupSessionsController.cancel,
);
router.post(
  "/:id/enrol",
  authMiddleware,
  roleGuard("STUDENT"),
  groupSessionsController.enrol,
);
router.delete(
  "/:id/enrol",
  authMiddleware,
  roleGuard("STUDENT"),
  groupSessionsController.leave,
);
router.get(
  "/:id/roster",
  authMiddleware,
  roleGuard("PROFESSIONAL", "ADMIN"),
  cacheMiddleware(20),
  groupSessionsController.getRoster,
);

router.post(
  "/:id/report",
  authMiddleware,
  roleGuard("STUDENT"),
  sessionReportsController.reportGroupSession,
);

export default router;
