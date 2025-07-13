import { Router } from "express";
import { UserRolesEnum, AvailableUserRoles } from "../utils/constants.js";
import {
  isLoggedIn,
  validateProjectPermission,
} from "../middleware/auth.middleware.js";
import {
  getNotes,
  getNoteById,
  createNote,
  updateNote,
  deleteNotes,
} from "../controllers/note.controllers.js";

const router = Router();

// Apply isLoggedIn middleware to all routes in this file.
// This ensures that the user is authenticated before any note-related action.
router.use(isLoggedIn);
router
  .route("/:projectId")
  .get(validateProjectPermission(AvailableUserRoles), getNotes)
  .post(validateProjectPermission([UserRolesEnum.ADMIN]), createNote);
router
  .route("/:projectId/n/:noteId")
  .get(validateProjectPermission(AvailableUserRoles), getNoteById)
  .put(validateProjectPermission([UserRolesEnum.ADMIN]), updateNote)
  .delete(validateProjectPermission([UserRolesEnum.ADMIN]), deleteNotes);
export default router;
