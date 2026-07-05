import { Router } from "express";
import * as groupSessionsController from "../controllers/groupSessions.controller";
import * as sessionReportsController from "../controllers/sessionReports.controller";
import { authMiddleware, roleGuard } from "../middleware";

const router = Router();

router.get(
  "/me",
  authMiddleware,
  roleGuard("PROFESSIONAL"),
  groupSessionsController.getOwn,
);

router.get("/", authMiddleware, groupSessionsController.list);
router.get("/:id", authMiddleware, groupSessionsController.getOne);
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
  groupSessionsController.getRoster,
);

router.post(
  "/:id/report",
  authMiddleware,
  roleGuard("STUDENT"),
  sessionReportsController.reportGroupSession,
);

export default router;
