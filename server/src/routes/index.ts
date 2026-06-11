import { Router } from "express";
import usersRouter from "./users.routes";
import careersRouter from "./careers.routes";
import sessionsRouter from "./sessions.routes";
import workshopsRouter from "./workshops.routes";
import bookingsRouter from "./bookings.routes";
import notificationsRouter from "./notifications.routes";

const router = Router();

router.use("/users", usersRouter);
router.use("/careers", careersRouter);
router.use("/sessions", sessionsRouter);
router.use("/workshops", workshopsRouter);
router.use("/bookings", bookingsRouter);
router.use("/notifications", notificationsRouter);

export default router;
