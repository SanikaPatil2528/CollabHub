import {Router} from "express";
import { registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    updateAccountDetails,
    updateUserAvatar,
    getCurrentUser,
    deleteUserAccount,
    searchUsersByUsername
  } from "../controllers/user.controller.js";
import {verifyJWT} from "..//middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router=Router();


// Public routes(Unprotected) -- anyone can access these
router.route("/register").post(
    upload.single("avatarLocalPath"), 
    registerUser
);;
router.route("/login").post(loginUser);
router.route("/refresh-token").post(refreshAccessToken);


// Protected routes (requires a valid JWT access token in cookies/headers)
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/current-user").get(verifyJWT, getCurrentUser);
router.route("/update-account").patch(verifyJWT, updateAccountDetails);
router.route("/delete-account").delete(verifyJWT,deleteUserAccount);

// GET /api/users/search?q=alex
router.get("/search", verifyJWT, searchUsersByUsername);

router.route("/update-avatar").patch(verifyJWT,upload.single("avatarLocalPath"),updateUserAvatar);


export default router;