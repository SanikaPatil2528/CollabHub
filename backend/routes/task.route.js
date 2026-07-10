import {Router} from "express";
import {verifyJWT} from "../middlewares/auth.middleware.js";
import {
    createTask,
    getProjectTasks,
    updateTaskDetails,
    updateTaskStatus,
    getMyTasks,
    deleteTask
} from "../controllers/task.controller.js";

const router=Router();

// protect all routes inside this module using authentication barrier
router.use(verifyJWT);

router.route("/me").get(getMyTasks);

router.route("/project/:projectId")
    .post(createTask)
    .get(getProjectTasks);

router.route("/:taskId")
    .patch(updateTaskDetails)
    .delete(deleteTask);

router.route("/:taskId/status").patch(updateTaskStatus);

export default router;