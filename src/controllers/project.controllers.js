import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ProjectNote } from "../models/note.models.js";
import { Project } from "../models/project.models.js";
import mongoose from "mongoose";
import { User } from "../models/user.models.js";
import { UserRolesEnum } from "../utils/constants.js";
import { ProjectMember } from "../models/projectmember.models.js";
const getProjects = asyncHandler(async (req, res) => {});
const getProjectById = asyncHandler(async (req, res) => {});

const createProject = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  if (!name) {
    throw new ApiError(401, "name and description required");
  }
  const project = await Project.findOne({ name });
  if (project) {
    throw new ApiError(401, "project with same name exist already");
  }

  // 1. Create the project
  const newProject = await Project.create({
    name,
    description,
    createdBy: new mongoose.Types.ObjectId(req.user._id),
  });

  // 2. Add creator as ProjectMember (role: "admin")
  await ProjectMember.create({
    user: new mongoose.Types.ObjectId(req.user._id),
    project: newProject._id,
    role: UserRolesEnum.ADMIN, // Use the constant instead of "admin",
  });

  // 3. Return the created project
  return res
    .status(201)
    .json(new ApiResponse(201, newProject, "Project created successfully"));
});

const updateProject = asyncHandler(async (req, res) => {});
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
