import {Router} from "express";
import{
    sendInvitation,
    getMyPendingInvitations,
    respondToinvitation
} from "../controllers/invitation.controller.js";
import {verifyJWT} from "../middlewares/auth.middleware.js";

const router=Router();

// secure all endpoints below with JWT validation
router.use(verifyJWT);

// path: /api/v1/invitations
router.route("/")
    .post(sendInvitation)
    .get(getMyPendingInvitations);

// path: /api/v1/invitations/:invitationId
router.route("/:invitationId")
    .patch(respondToinvitation);

export default router;