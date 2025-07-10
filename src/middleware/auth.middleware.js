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

export const validateProjectPermission = (requiredRoles = []) =>
  asyncHandler(async (req, res, next) => {
    const { projectId } = req.params;

    // 1. Check if projectId is a valid ObjectId format
    if (!mongoose.isValidObjectId(projectId)) {
      throw new ApiError(400, "Invalid project ID format.");
    }

    // 2. Find the user's membership for this project
    const membership = await ProjectMember.findOne({
      project: projectId,
      user: req.user._id,
    });

    // 3. If no membership, user has no access. Use 404 to not reveal project existence.
    if (!membership) {
      throw new ApiError(404, "Project not found or you do not have access.");
    }

    // 4. Check if the user's role meets the requirements
    // If requiredRoles is empty, just being a member is enough.
    if (requiredRoles.length > 0 && !requiredRoles.includes(membership.role)) {
      throw new ApiError(
        403,
        "You do not have permission to perform this action.",
      );
    }

    // Attach the membership to the request object for use in subsequent controllers
    req.projectMembership = membership;

    // 5. If all checks pass, proceed to the next middleware/controller
    next();
  });
