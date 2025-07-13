import { Router } from "express";
import {
  isLoggedIn,
  validateProjectPermission,
} from "../middleware/auth.middleware.js";
import { UserRolesEnum } from "../utils/constants.js";
import {
  createTask,
  getTasksInProject,
  getTaskById,
  updateTask,
  deleteTask,
  updateTaskStatus,
  assignTask,
  addTaskAttachments,
  deleteTaskAttachment,
} from "../controllers/task.controllers.js";
import { upload } from "../middleware/multer.middleware.js";

const router = Router();

// Apply isLoggedIn middleware to all routes in this file
router.use(isLoggedIn);

// Routes for getting all tasks in a project and creating a new task
router
  .route("/:projectId")
  .post(
    validateProjectPermission([UserRolesEnum.ADMIN, UserRolesEnum.MEMBER]),
    createTask,
  )
  .get(validateProjectPermission([]), getTasksInProject);

// Routes for a specific task
router
  .route("/:projectId/:taskId")
  .get(validateProjectPermission([]), getTaskById)
  .put(
    validateProjectPermission([UserRolesEnum.ADMIN, UserRolesEnum.MEMBER]),
    updateTask,
  )
  .delete(
    validateProjectPermission([UserRolesEnum.ADMIN, UserRolesEnum.MEMBER]),
    deleteTask,
  );

// Route for updating a task's status
router
  .route("/:projectId/:taskId/status")
  .patch(
    validateProjectPermission([UserRolesEnum.ADMIN, UserRolesEnum.MEMBER]),
    updateTaskStatus,
  );

// Route for assigning a task to a user
router
  .route("/:projectId/:taskId/assign")
  .patch(validateProjectPermission([UserRolesEnum.ADMIN]), assignTask);

// Route for adding attachments to a task
router.route("/:projectId/:taskId/attachments").patch(
  validateProjectPermission([UserRolesEnum.ADMIN, UserRolesEnum.MEMBER]),
  upload.array("attachments", 5), // Allow up to 5 files at once
  addTaskAttachments,
);

// Route for deleting an attachment from a task
router
  .route("/:projectId/:taskId/attachments/:attachmentId")
  .delete(
    validateProjectPermission([UserRolesEnum.ADMIN, UserRolesEnum.MEMBER]),
    deleteTaskAttachment,
  );

export default router;
