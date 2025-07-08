import jwt from "jsonwebtoken";
import { User } from "../models/user.models.js";
import { ProjectMember } from "../models/projectmember.models.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import mongoose from "mongoose";
export const isLoggedIn = asyncHandler(async (req, res, next) => {
  let token =
    req.cookies?.token || req.header("Authorization")?.replace("Bearer ", "");
  if (!token) {
    throw new ApiError(401, "Authentication fail: No token");
  }
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new ApiError(401, "Authentication fail: Invalid or expired token");
  }
  // Fetch user from DB and attach (excluding sensitive fields)
  const user = await User.findById(decoded.id).select(
    "_id email username fullname role isEmailVerified",
  );
  if (!user) {
    throw new ApiError(401, "Authentication fail: User not found");
  }
  req.user = user;
  next();
});

export const validateProjectPermission = (roles = []) =>
  asyncHandler(async (req, res, next) => {
    const { projectId } = req.params;
    if (!projectId) {
      throw new ApiError(401, "Invalid Project id");
    }
    const project = await ProjectMember.findOne({
      project: mongoose.Types.ObjectId(projectId),
      user: mongoose.Types.ObjectId(req.user._id),
    });
    if (!project) {
      throw new ApiError(401, "project not find");
    }

    const givenRole = project?.role;
    req.user.role = givenRole; // Attach project-specific role to req.user for downstream use

    if (!roles.includes(givenRole)) {
      throw new ApiError(
        403,
        "you dont have permission to perform this action",
      );
    }
  });
