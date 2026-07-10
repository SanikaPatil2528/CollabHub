import {Router} from "express";
import {verifyJWT} from "../middlewares/auth.middleware.js";
import {
    createComment,
    getTaskComments,
    getProjectComments,
    updateComment,
    deleteComment
} from "../controllers/comment.controller.js";

const router=Router();

// secure all messaging features with token validation
router.use(verifyJWT);

// project level end-points
router.route("/project/:projectId")
    .post(createComment)
    .get(getProjectComments);

// task-level endpoints
router.route("/task/:taskId").get(getTaskComments);

// individual messaging actions
router.route("/:commentId")
    .patch(updateComment)
    .delete(deleteComment);

export default router;