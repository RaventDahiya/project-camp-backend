import { Router } from "express";
import { isLoggedIn } from "../middleware/auth.middleware.js";
import {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  addMembersToProject,
  getProjectMembers,
  updateProjectMembers,
  updateMemberRole,
  deleteMember,
} from "../controllers/project.controllers.js";

const router = Router();

// Projects collection routes
router.route("/").get(isLoggedIn, getProjects).post(isLoggedIn, createProject);

// Single project routes
router
  .route("/:projectId")
  .get(isLoggedIn, getProjectById)
  .put(isLoggedIn, updateProject)
  .delete(isLoggedIn, deleteProject);

// Project members collection routes
router
  .route("/:projectId/members")
  .post(isLoggedIn, addMembersToProject)
  .get(isLoggedIn, getProjectMembers)
  .put(isLoggedIn, updateProjectMembers);

// Single project member routes
router
  .route("/:projectId/members/:memberId/role")
  .put(isLoggedIn, updateMemberRole);

router.route("/:projectId/members/:memberId").delete(isLoggedIn, deleteMember);

export default router;
