import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ProjectNote } from "../models/note.models.js";
import { Project } from "../models/project.models.js";
import mongoose from "mongoose";
import { User } from "../models/user.models.js";
import { UserRolesEnum } from "../utils/constants.js";
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

  // **Crucial Security Check**
  // Before fetching the project, verify the current user is a member.
  // We use findOne because we only need to confirm that a link exists.
  const membership = await ProjectMember.findOne({
    project: projectId,
    user: req.user._id,
  });

  // If no membership is found, the user does not have access.
  // We use 404 to avoid revealing the project's existence to an unauthorized user.
  if (!membership) {
    throw new ApiError(404, "Project not found or you do not have access");
  }

  // If the check passes, fetch the full project details using the projectId from the URL.
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

  // 2. Permission Check: Verify the user is an admin of this project
  const membership = await ProjectMember.findOne({
    user: req.user._id,
    project: projectId,
  });

  if (!membership || membership.role !== UserRolesEnum.ADMIN) {
    throw new ApiError(
      403,
      "You do not have permission to update this project.",
    );
  }

  // 3. Unique Name Check (only if the name is being updated)
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

  // 4. Perform the update
  const updatedProject = await Project.findByIdAndUpdate(
    projectId,
    { $set: { name, description } }, // Use $set to update only provided fields
    { new: true }, // Return the updated document
  );

  if (!updatedProject) {
    throw new ApiError(404, "project not found");
  }

  // 5. Send the success response
  return res
    .status(200)
    .json(new ApiResponse(200, updatedProject, "Project updated successfully"));
});

const deleteProject = asyncHandler(async (req, res) => {});
const addMembersToProject = asyncHandler(async (req, res) => {});
const getProjectMembers = asyncHandler(async (req, res) => {});
const updateProjectMembers = asyncHandler(async (req, res) => {});
const updateMemberRole = asyncHandler(async (req, res) => {});
const deleteMember = asyncHandler(async (req, res) => {});

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
