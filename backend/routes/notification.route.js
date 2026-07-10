import {Router} from "express";
import {verifyJWT} from "../middlewares/auth.middleware.js";
import{
    getUserNotifications,
    markAllNotificationsAsRead,
    markNotificationAsRead
} from "../controllers/notification.controller.js";

const router = Router();

// wrap this router in JWT security shell
router.use(verifyJWT);

// inbox interactions
router.route("/")
    .get(getUserNotifications)
    .patch(markAllNotificationsAsRead);

// target single interaction
router.route("/:notificationId/read")
    .patch(markNotificationAsRead);

export default router;