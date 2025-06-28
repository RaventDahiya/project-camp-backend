import { body } from "express-validator";

const userRegistrationValidator = () => {
  return [
    body("email")
      .trim()
      .notEmpty()
      .withMessage("emial is required")
      .isEmail()
      .withMessage("email is invalid"),
    body("username")
      .trim()
      .notEmpty()
      .withMessage("username is required")
      .isLength({ min: 3 })
      .withMessage("username should be at least 3 char")
      .isLength({ max: 13 })
      .withMessage("username cannot excced 13 char"),
  ];
};

const userLoginValidator = () => {
  return [
    body("email").isEmail().withMessage("email is invalid"),
    body("password").notEmpty().withMessage("password cannot be empty"),
  ];
};
export { userRegistrationValidator, userLoginValidator };
