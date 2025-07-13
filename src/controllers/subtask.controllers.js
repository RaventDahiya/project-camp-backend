import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { SubTask } from "../models/subtask.models.js";
import { Task } from "../models/task.models.js";

/**
 * @description Create a new subtask for a specific task
 * @route POST /api/v1/subtasks/:projectId/:taskId
 */
const createSubTask = asyncHandler(async (req, res) => {
  const { projectId, taskId } = req.params;
  const { title } = req.body;

  // The `validateProjectPermission` middleware already checks project access.

  // We must also verify that the parent task (`taskId`) belongs to the project (`projectId`).
  // This is a critical security check to prevent creating subtasks under another project's task.
  const parentTask = await Task.findOne({
    _id: taskId,
    project: projectId,
  });

  if (!parentTask) {
    throw new ApiError(404, "Parent task not found in this project.");
  }

  if (!title) {
    throw new ApiError(400, "Subtask title is required.");
  }

  const subtask = await SubTask.create({
    title,
    task: taskId,
    createdBy: req.user._id,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, subtask, "Subtask created successfully."));
});

/**
 * @description Get all subtasks for a specific task
 * @route GET /api/v1/subtasks/:projectId/:taskId
 */
const getSubTasksForTask = asyncHandler(async (req, res) => {
  const { projectId, taskId } = req.params;

  // Verify the parent task belongs to the project to ensure we're not leaking data.
  const parentTask = await Task.findOne({
    _id: taskId,
    project: projectId,
  });

  if (!parentTask) {
    throw new ApiError(404, "Task not found in this project.");
  }

  // Find all subtasks for the given task and populate the creator's details.
  const subtasks = await SubTask.find({ task: taskId }).populate(
    "createdBy",
    "username fullname avatar",
  );

  return res
    .status(200)
    .json(new ApiResponse(200, subtasks, "Subtasks fetched successfully."));
});

/**
 * @description Update a subtask's title
 * @route PUT /api/v1/subtasks/:projectId/:taskId/:subTaskId
 */
const updateSubTask = asyncHandler(async (req, res) => {
  const { projectId, taskId, subTaskId } = req.params;
  const { title } = req.body;

  if (!title) {
    throw new ApiError(400, "Title is required for an update.");
  }

  // First, ensure the parent task exists in the project.
  const parentTask = await Task.findOne({
    _id: taskId,
    project: projectId,
  });

  if (!parentTask) {
    throw new ApiError(404, "Parent task not found in this project.");
  }

  // Now, find and update the subtask, ensuring it belongs to the correct parent task.
  const updatedSubTask = await SubTask.findOneAndUpdate(
    { _id: subTaskId, task: taskId },
    { $set: { title } },
    { new: true, runValidators: true },
  );

  if (!updatedSubTask) {
    throw new ApiError(404, "Subtask not found for this task.");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, updatedSubTask, "Subtask updated successfully."),
    );
});

/**
 * @description Delete a subtask
 * @route DELETE /api/v1/subtasks/:projectId/:taskId/:subTaskId
 */
const deleteSubTask = asyncHandler(async (req, res) => {
  const { projectId, taskId, subTaskId } = req.params;

  // Ensure the parent task exists in the project before attempting to delete a subtask.
  const parentTask = await Task.findOne({
    _id: taskId,
    project: projectId,
  });

  if (!parentTask) {
    throw new ApiError(404, "Parent task not found in this project.");
  }

  // Find and delete the subtask, ensuring it belongs to the correct parent task.
  const deletedSubTask = await SubTask.findOneAndDelete({
    _id: subTaskId,
    task: taskId,
  });

  if (!deletedSubTask) {
    throw new ApiError(404, "Subtask not found for this task.");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, { _id: subTaskId }, "Subtask deleted successfully."),
    );
});

/**
 * @description Toggle the completion status of a subtask
 * @route PATCH /api/v1/subtasks/:projectId/:taskId/:subTaskId/toggle-status
 */
const toggleSubTaskStatus = asyncHandler(async (req, res) => {
  const { projectId, taskId, subTaskId } = req.params;

  // Ensure the parent task exists in the project.
  const parentTask = await Task.findOne({
    _id: taskId,
    project: projectId,
  });

  if (!parentTask) {
    throw new ApiError(404, "Parent task not found in this project.");
  }

  // Find the subtask to ensure it exists before toggling.
  const subTaskToToggle = await SubTask.findOne({
    _id: subTaskId,
    task: taskId,
  });

  if (!subTaskToToggle) {
    throw new ApiError(404, "Subtask not found for this task.");
  }

  // Toggle the completion status and save.
  subTaskToToggle.isCompleted = !subTaskToToggle.isCompleted;
  await subTaskToToggle.save({ validateBeforeSave: false }); // Skip validation as we are only toggling a boolean

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        subTaskToToggle,
        "Subtask status toggled successfully.",
      ),
    );
});

export {
  createSubTask,
  getSubTasksForTask,
  updateSubTask,
  deleteSubTask,
  toggleSubTaskStatus,
};
