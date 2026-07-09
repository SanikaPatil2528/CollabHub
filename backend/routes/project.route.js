import {Router} from "express";
import {
    createProject,
    getProjectDetails,
    getUserProjects,
    updateProjectDetails,
    deleteProject,
    removeMember,
    leaveProject
} from "../controllers/project.controller.js";
import {verifyJWT} from "../middlewares/auth.middleware.js";

const router=Router();

// apply the authentication bouncer globally across all project routes
router.use(verifyJWT);

// Endpoint: /api/v1/projects
router.route("/")
    .post(createProject)
    .get(getUserProjects);

// Endpoint: /api/v1/projects/:projectId
router.route("/:projectId")
    .get(getProjectDetails)
    .patch(updateProjectDetails)
    .delete(deleteProject);

router.route("/:projectId/leave").post(leaveProject);
router.route("/:projectId/remove-member").patch(removeMember);

export default router;