import { Router } from "express";
import {
  isLoggedIn,
  validateProjectPermission,
} from "../middleware/auth.middleware.js";
import { AvailableUserRoles, UserRolesEnum } from "../utils/constants.js";
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
  .get(isLoggedIn, validateProjectPermission([]), getProjectById) // Added permission check
  .put(
    isLoggedIn,
    validateProjectPermission([UserRolesEnum.ADMIN]),
    updateProject,
  )
  .delete(
    isLoggedIn,
    validateProjectPermission([UserRolesEnum.ADMIN]),
    deleteProject,
  );

// Project members collection routes
router
  .route("/:projectId/members")
  .post(
    isLoggedIn,
    validateProjectPermission([UserRolesEnum.ADMIN]),
    addMembersToProject,
  )
  .get(isLoggedIn, validateProjectPermission([]), getProjectMembers);
// .put(
//   isLoggedIn,
//   validateProjectPermission([UserRolesEnum.ADMIN]),
//   updateProjectMembers,
// );

// Single project member routes
router
  .route("/:projectId/members/:memberId/role")
  .put(
    isLoggedIn,
    validateProjectPermission([UserRolesEnum.ADMIN]),
    updateMemberRole,
  );

router
  .route("/:projectId/members/:memberId")
  .delete(
    isLoggedIn,
    validateProjectPermission([UserRolesEnum.ADMIN]),
    deleteMember,
  );

export default router;
