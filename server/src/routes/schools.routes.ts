import { Router } from "express";
import * as schoolsController from "../controllers/schools.controller";
import { authMiddleware, roleGuard, cacheMiddleware } from "../middleware";

const router = Router();

router.get("/public", cacheMiddleware(300), schoolsController.listPublic);
router.get("/", authMiddleware, roleGuard("ADMIN"), cacheMiddleware(30), schoolsController.list);
router.post("/", authMiddleware, roleGuard("ADMIN"), schoolsController.create);
router.get(
  "/:id",
  authMiddleware,
  roleGuard("ADMIN", "CAREER_GUIDE"),
  cacheMiddleware(30),
  schoolsController.getOne,
);
router.patch(
  "/:id",
  authMiddleware,
  roleGuard("ADMIN"),
  schoolsController.update,
);
router.post(
  "/:id/career-guide",
  authMiddleware,
  roleGuard("ADMIN"),
  schoolsController.assignCareerGuide,
);

export default router;
