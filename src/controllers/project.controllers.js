import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ProjectNote } from "../models/note.models.js";
import { Project } from "../models/project.models.js";
import mongoose from "mongoose";
import { User } from "../models/user.models.js";
import { AvailableUserRoles, UserRolesEnum } from "../utils/constants.js";
import { Task } from "../models/task.models.js";
import { SubTask } from "../models/subtask.models.js";
import { ProjectMember } from "../models/projectmember.models.js";

const getProjects = asyncHandler(async (req, res) => {
  // Find all project memberships for the current user.
  // The `isLoggedIn` middleware already confirms the user exists, so we can
  // safely use `req.user._id` without re-fetching the user.
  const projectMemberships = await ProjectMember.find({ user: req.user._id });

  // If the user isn't in any projects, return an empty array.
  if (!projectMemberships || projectMemberships.length === 0) {
    return res
      .status(200)
      .json(new ApiResponse(200, [], "User is not part of any projects"));
  }

  // Extract just the project IDs from the membership documents.
  const projectIds = projectMemberships.map((membership) => membership.project);

  // Now, use those IDs to fetch the actual projects from the Project collection.
  // We use .populate() to also get details of the user who created the project.
  const projects = await Project.find({
    _id: { $in: projectIds },
  }).populate("createdBy", "username fullname");

  return res
    .status(200)
    .json(new ApiResponse(200, projects, "Projects fetched successfully"));
});

const getProjectById = asyncHandler(async (req, res) => {
  const { projectId } = req.params;

  // The `validateProjectPermission` middleware has already confirmed the user is a member.
  // We can safely proceed to fetch the project details.

  const projectDetails = await Project.findById(projectId).populate(
    "createdBy",
    "username fullname",
  );

  // This handles the edge case where a project is deleted but a membership link might still exist.
  if (!projectDetails) {
    throw new ApiError(404, "Project not found");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, projectDetails, "Project fetched successfully"));
});

const createProject = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  if (!name) {
    throw new ApiError(400, "Project name is required");
  }
  const project = await Project.findOne({ name });
  if (project) {
    throw new ApiError(409, "A project with this name already exists");
  }

  // 1. Create the project
  const newProject = await Project.create({
    name,
    description,
    createdBy: req.user._id, // Mongoose is smart enough to handle this!
  });

  // 2. Add creator as ProjectMember (role: "admin")
  await ProjectMember.create({
    user: req.user._id,
    project: newProject._id,
    role: UserRolesEnum.ADMIN,
  });

  // 3. Return the created project
  return res
    .status(201)
    .json(new ApiResponse(201, newProject, "Project created successfully"));
});

const updateProject = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const { name, description } = req.body;

  // 1. Validate input: at least one field must be provided for an update
  if (!name && !description) {
    throw new ApiError(400, "Please provide a name or description to update.");
  }

  // The `validateProjectPermission` middleware has already confirmed the user is an ADMIN.

  // 2. Unique Name Check (only if the name is being updated)
  if (name) {
    // Find a project with the same name but a DIFFERENT ID.
    const existingProject = await Project.findOne({
      name,
      _id: { $ne: projectId },
    });

    if (existingProject) {
      throw new ApiError(409, "A project with this name already exists.");
    }
  }

  // 3. Perform the update
  const updatedProject = await Project.findByIdAndUpdate(
    projectId,
    { $set: { name, description } }, // Use $set to update only provided fields
    { new: true }, // Return the updated document
  );

  if (!updatedProject) {
    throw new ApiError(404, "project not found");
  }

  // 4. Send the success response
  return res
    .status(200)
    .json(new ApiResponse(200, updatedProject, "Project updated successfully"));
});

const deleteProject = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const session = await mongoose.startSession();

  try {
    session.startTransaction();
    const tasks = await Task.find({ project: projectId })
      .select("_id")
      .session(session);
    const taskIds = tasks.map((task) => task._id);
    if (taskIds.length > 0) {
      await SubTask.deleteMany({ task: { $in: taskIds } }, { session });
    }
    await Task.deleteMany({ project: projectId }, { session });

    await ProjectNote.deleteMany({ project: projectId }, { session });

    await ProjectMember.deleteMany({ project: projectId }, { session });

    const deletedProject = await Project.findByIdAndDelete(projectId, {
      session,
    });

    if (!deletedProject) {
      throw new ApiError(404, "Project not found");
    }

    await session.commitTransaction();

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { _id: projectId },
          "Project and associated data deleted successfully",
        ),
      );
  } catch (error) {
    // If any error occurs during the transaction, abort it
    await session.abortTransaction();
    // Re-throw the error to be handled by the asyncHandler
    throw error;
  } finally {
    // Always end the session
    session.endSession();
  }
});

const addMembersToProject = asyncHandler(async (req, res) => {
  // The `validateProjectPermission` middleware has already confirmed the requesting user is an ADMIN.

  // 1. Get Inputs
  const { projectId } = req.params;
  const { email, role } = req.body;

  // 2. Validate Inputs
  if (!email) {
    throw new ApiError(400, "User email is required to add a member.");
  }

  // Optional: Validate the role if it's provided
  if (role && !AvailableUserRoles.includes(role)) {
    throw new ApiError(400, "Invalid role specified.");
  }

  // 3. Find the user to add
  const userToAdd = await User.findOne({ email });

  if (!userToAdd) {
    throw new ApiError(404, "User with the specified email does not exist.");
  }

  // New check: Ensure the user's email is verified
  if (!userToAdd.isEmailVerified) {
    throw new ApiError(
      400,
      "Cannot add an unverified user. The user must verify their email first.",
    );
  }

  // 4. Check if the user is already a member of the project
  const existingMembership = await ProjectMember.findOne({
    project: projectId,
    user: userToAdd._id,
  });

  if (existingMembership) {
    throw new ApiError(409, "User is already a member of this project.");
  }

  // 5. Create the new membership
  const newMember = await ProjectMember.create({
    project: projectId,
    user: userToAdd._id,
    role: role || UserRolesEnum.MEMBER, // Default to MEMBER if no role is provided
  });

  // 6. Send success response
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        newMember,
        "User added to the project successfully.",
      ),
    );
});

const getProjectMembers = asyncHandler(async (req, res) => {
  // The `validateProjectPermission` middleware has already confirmed the user is a member.
  const { projectId } = req.params;

  // Find all membership documents for the given project.
  // Use .populate() to efficiently fetch the details of each user.
  // We select specific fields from the user to avoid exposing sensitive data.
  const members = await ProjectMember.find({
    project: projectId,
  }).populate("user", "username fullname email avatar");

  // .find() returns an empty array if no documents are found, which is the correct response.
  return res
    .status(200)
    .json(
      new ApiResponse(200, members, "Project members fetched successfully."),
    );
});

/**
 * @description This controller is for bulk updating project members.
 * It allows replacing the entire member list in one go.
 * This is a complex operation and is currently not needed for the application's core functionality.
 * It is kept here for potential future use if a more advanced member management UI is built.
 */
const updateProjectMembers = asyncHandler(async (req, res) => {});

const updateMemberRole = asyncHandler(async (req, res) => {
  // The `validateProjectPermission` middleware has already confirmed the requesting user is an ADMIN.

  // 1. Get Inputs
  const { projectId, memberId } = req.params;
  const { role } = req.body;

  // 2. Validate role input
  if (!role || !AvailableUserRoles.includes(role)) {
    throw new ApiError(400, "Invalid role specified.");
  }

  // 3. Find the membership document to update using the memberId from the URL
  const membershipToUpdate = await ProjectMember.findById(memberId);

  // Also, ensure the found member belongs to the correct project
  if (
    !membershipToUpdate ||
    membershipToUpdate.project.toString() !== projectId
  ) {
    throw new ApiError(404, "Member not found in this project.");
  }

  // 4. Prevent the last admin from being demoted or removed
  if (
    membershipToUpdate.role === UserRolesEnum.ADMIN &&
    role !== UserRolesEnum.ADMIN
  ) {
    const adminCount = await ProjectMember.countDocuments({
      project: projectId,
      role: UserRolesEnum.ADMIN,
    });

    if (adminCount <= 1) {
      throw new ApiError(400, "Cannot remove the last admin from the project.");
    }
  }

  // 5. Update and save the role
  membershipToUpdate.role = role;
  await membershipToUpdate.save();

  // 6. Send success response
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        membershipToUpdate,
        "Member role updated successfully.",
      ),
    );
});

const deleteMember = asyncHandler(async (req, res) => {
  // The `validateProjectPermission` middleware has already confirmed the user is an ADMIN.

  const { projectId, memberId } = req.params;
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    // 2. Find the membership document to delete
    const membershipToDelete =
      await ProjectMember.findById(memberId).session(session);

    // 3. Validate the membership exists and belongs to the correct project
    if (
      !membershipToDelete ||
      membershipToDelete.project.toString() !== projectId
    ) {
      throw new ApiError(404, "Member not found in this project.");
    }

    // 4. Prevent the last admin from being removed
    if (membershipToDelete.role === UserRolesEnum.ADMIN) {
      const adminCount = await ProjectMember.countDocuments(
        {
          project: projectId,
          role: UserRolesEnum.ADMIN,
        },
        { session },
      );

      if (adminCount <= 1) {
        throw new ApiError(
          400,
          "Cannot remove the last admin from the project. Please assign a new admin first.",
        );
      }
    }

    // 5. Handle Data Integrity: Un-assign tasks from the user being removed.
    await Task.updateMany(
      { project: projectId, assignedTo: membershipToDelete.user },
      { $set: { assignedTo: null } },
      { session },
    );

    // 6. Delete the membership
    await ProjectMember.findByIdAndDelete(memberId, { session });

    await session.commitTransaction();

    return res
      .status(200)
      .json(
        new ApiResponse(200, {}, "Member removed from project successfully."),
      );
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
});

export {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  addMembersToProject,
  getProjectMembers,
  updateProjectMembers,
  updateMemberRole,
  deleteMember,
};
