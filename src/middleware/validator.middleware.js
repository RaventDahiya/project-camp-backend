import { validationResult } from "express-validator";
import { ApiError } from "../utils/ApiError.js";
export const validator = (req, res, next) => {
  const err = validationResult(req);
  if (err.isEmpty()) {
    return next();
  }
  const extractedError = [];
  err.array().map((e) =>
    extractedError.push({
      [e.path]: e.msg,
    }),
  );

  throw new ApiError(422, "Recieved data is not valid", extractedError);
};
