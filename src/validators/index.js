import { body } from "express-validator";
import { AvailableUserRoles } from "../utils/constants.js";

const userRegistrationValidator = () => {
  return [
    body("email")
      .trim()
      .notEmpty()
      .withMessage("email is required")
      .isEmail()
      .withMessage("email is invalid"),
    body("username")
      .trim()
      .notEmpty()
      .withMessage("username is required")
      .isLength({ min: 3 })
      .withMessage("username should be at least 3 char")
      .isLength({ max: 13 })
      .withMessage("username cannot exceed 13 char"),
    body("fullname").trim().notEmpty().withMessage("fullname is required"),
    body("password")
      .notEmpty()
      .withMessage("password is required")
      .isLength({ min: 6 })
      .withMessage("password should be at least 6 characters"),
    body("role")
      .notEmpty()
      .withMessage("role is required")
      .isIn(AvailableUserRoles)
      .withMessage("role is invalid"),
  ];
};

const userLoginValidator = () => {
  return [
    body("email").isEmail().withMessage("email is invalid"),
    body("password").notEmpty().withMessage("password cannot be empty"),
  ];
};

const userPasswordValidator = () => {
  return [
    body("newPassword")
      .notEmpty()
      .withMessage("newPassword is required")
      .isLength({ min: 6 })
      .withMessage("newPassword should be at least 6 characters"),
  ];
};

export { userRegistrationValidator, userLoginValidator, userPasswordValidator };
