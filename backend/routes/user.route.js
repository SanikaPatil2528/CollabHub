import {Router} from "express";
import { registerUser,loginUser,logoutUser } from "../controllers/user.controller.js";
import {verifyJWT} from "..//middlewares/auth.middleware.js";

const router=Router();

// Public routes -- anyone can access these
router.route("/register").post(registerUser);
router.route("/login").post(loginUser);

// Protected routes (requires a valid JWT access token in cookies/headers)
router.route("/logout").post(verifyJWT, logoutUser);

export default router;