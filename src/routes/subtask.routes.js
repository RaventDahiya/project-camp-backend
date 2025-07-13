import { Router } from "express";
import {
  isLoggedIn,
  validateProjectPermission,
} from "../middleware/auth.middleware.js";
import { UserRolesEnum } from "../utils/constants.js";
import {
  createSubTask,
  deleteSubTask,
  getSubTasksForTask,
  toggleSubTaskStatus,
  updateSubTask,
} from "../controllers/subtask.controllers.js";

const router = Router();

// Apply isLoggedIn middleware to all routes in this file
router.use(isLoggedIn);

// Base routes for a task's subtasks
router
  .route("/:projectId/:taskId")
  .post(
    validateProjectPermission([UserRolesEnum.ADMIN, UserRolesEnum.MEMBER]),
    createSubTask,
  )
  .get(validateProjectPermission([]), getSubTasksForTask);

// Routes for a specific subtask
router
  .route("/:projectId/:taskId/:subTaskId")
  .put(
    validateProjectPermission([UserRolesEnum.ADMIN, UserRolesEnum.MEMBER]),
    updateSubTask,
  )
  .delete(
    validateProjectPermission([UserRolesEnum.ADMIN, UserRolesEnum.MEMBER]),
    deleteSubTask,
  );

// Route for toggling subtask completion status
router
  .route("/:projectId/:taskId/:subTaskId/toggle-status")
  .patch(
    validateProjectPermission([UserRolesEnum.ADMIN, UserRolesEnum.MEMBER]),
    toggleSubTaskStatus,
  );

export default router;
