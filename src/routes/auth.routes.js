import { Router } from "express";
import { registerUser } from "../controllers/auth.controllers.js";
import { validator } from "../middleware/validator.middleware.js";
import { userRegistrationValidator } from "../validators/index.js";
const router = Router();
router
  .route("/register")
  .post(userRegistrationValidator(), validator, registerUser);

export default router;
