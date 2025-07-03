import { Router } from "express";
import { isLoggedIn } from "../middleware/auth.middleware.js";
import {
  registerUser,
  verifyEmail,
  logoutUser,
  loginUser,
  resendVerificationEmail,
  refreshAccessToken,
  forgotPasswordRequest,
  changeCurrentPassword,
  getCurrentUser,
  changePassword,
} from "../controllers/auth.controllers.js";
import { validator } from "../middleware/validator.middleware.js";
import {
  userRegistrationValidator,
  userLoginValidator,
  userPasswordValidator,
} from "../validators/index.js";

const router = Router();
router
  .route("/register")
  .post(userRegistrationValidator(), validator, registerUser);
router.route("/verify/:token").get(verifyEmail);
router.route("/login").post(userLoginValidator(), validator, loginUser);
router.route("/logout").post(isLoggedIn, logoutUser);
router
  .route("/resendVerificationEmail")
  .post(userLoginValidator(), validator, resendVerificationEmail);
router.route("/forgotPassword").post(validator, forgotPasswordRequest);
router
  .route("/changePassword/:token")
  .post(userPasswordValidator(), validator, changePassword);

export default router;
