import {Router} from "express";
import { recommendedTeamMembers } from "../controllers/ai.controller.js";
import {verifyJWT} from "../middlewares/auth.middleware.js";

const router=Router();

router.route("/recommend-team").post(verifyJWT,recommendedTeamMembers);

export default router;