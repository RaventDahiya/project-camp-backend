import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Task } from "../models/task.models.js";
import { SubTask } from "../models/subtask.models.js";
import { ProjectMember } from "../models/projectmember.models.js";
import { AvailableTasksStatus, TasksStatusEnum } from "../utils/constants.js";
import { uploadOnCloudinary, deleteOnCloudinary } from "../utils/cloudinary.js";

/**
 * @description Create a new task within a project
 * @route POST /api/v1/tasks/:projectId
 */
const createTask = asyncHandler(async (req, res) => {
  // 1. Get projectId from params and task details from body
  const { projectId } = req.params;
  const { title, description, assignedTo, status } = req.body;

  // 2. Validate required inputs based on the schema
  if (!title) {
    throw new ApiError(400, "Task title is required.");
  }
  if (!assignedTo) {
    throw new ApiError(400, "A user must be assigned to the task.");
  }

  // Optional: Validate the status if it's provided
  if (status && !AvailableTasksStatus.includes(status)) {
    throw new ApiError(400, "Invalid task status provided.");
  }

  // 3. Check if the user being assigned is a member of the project
  const member = await ProjectMember.findOne({
    project: projectId,
    user: assignedTo,
  });
  if (!member) {
    throw new ApiError(
      400,
      "The user you are assigning this task to is not a member of the project.",
    );
  }

  // 4. Create the task with assignedBy as the current user (req.user._id)
  const task = await Task.create({
    title,
    description,
    project: projectId,
    assignedTo,
    assignedBy: req.user._id,
    status: status || TasksStatusEnum.TODO, // Default to 'todo' if not provided
  });

  // 5. Populate necessary fields and return the new task
  const populatedTask = await Task.findById(task._id)
    .populate("assignedTo", "username fullname email avatar")
    .populate("assignedBy", "username fullname email avatar");

  return res
    .status(201)
    .json(new ApiResponse(201, populatedTask, "Task created successfully"));
});

/**
 * @description Get all tasks for a specific project
 * @route GET /api/v1/tasks/:projectId
 */
const getTasksInProject = asyncHandler(async (req, res) => {
  // The `validateProjectPermission` middleware has already confirmed the user is a member.
  const { projectId } = req.params;

  // Find all tasks for the project and populate user details in a single, efficient query.
  const tasks = await Task.find({
    project: projectId,
  })
    .populate("assignedTo", "username fullname email avatar")
    .populate("assignedBy", "username fullname email avatar");

  // .find() returns an empty array if no tasks are found, which is the correct response.
  return res
    .status(200)
    .json(new ApiResponse(200, tasks, "Tasks fetched successfully."));
});

/**
 * @description Get a single task by its ID
 * @route GET /api/v1/tasks/:projectId/:taskId
 */
const getTaskById = asyncHandler(async (req, res) => {
  // 1. Get projectId and taskId from params
  const { projectId, taskId } = req.params;

  // 2. Find the task by its ID, ensuring it belongs to the correct project
  // This is a crucial security check to prevent accessing tasks from other projects.
  const task = await Task.findOne({
    _id: taskId,
    project: projectId,
  })
    .populate("assignedTo", "username fullname email avatar")
    .populate("assignedBy", "username fullname email avatar");

  if (!task) {
    throw new ApiError(404, "Task not found in this project.");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, task, "Task fetched successfully."));
});

/**
 * @description Update a task's details (title, description)
 * @route PUT /api/v1/tasks/:projectId/:taskId
 */
const updateTask = asyncHandler(async (req, res) => {
  // 1. Get projectId and taskId from params, and new details from body
  const { projectId, taskId } = req.params;
  const { title, description } = req.body;

  // 2. Validate that at least one field to update is provided
  if (!title && !description) {
    throw new ApiError(400, "Please provide a title or description to update.");
  }

  // 3. Build the update object with only the provided fields to prevent accidental data wiping
  const updateFields = {};
  if (title) updateFields.title = title;
  if (description) updateFields.description = description;

  // 4. Find and update the task in one atomic operation using findOneAndUpdate
  const updatedTask = await Task.findOneAndUpdate(
    { _id: taskId, project: projectId }, // Ensure the task belongs to the correct project
    { $set: updateFields }, // Use $set to only update the provided fields
    { new: true, runValidators: true }, // Options to return the new doc and run schema validators
  )
    .populate("assignedTo", "username fullname email avatar")
    .populate("assignedBy", "username fullname email avatar");

  // 5. Check if the task was found and updated
  if (!updatedTask) {
    throw new ApiError(404, "Task not found in this project.");
  }

  // 6. Return the updated task
  return res
    .status(200)
    .json(new ApiResponse(200, updatedTask, "Task updated successfully."));
});

/**
 * @description Delete a task and its associated subtasks
 * @route DELETE /api/v1/tasks/:projectId/:taskId
 */
const deleteTask = asyncHandler(async (req, res) => {
  const { projectId, taskId } = req.params;

  // A transaction ensures that if any of the delete operations fail,
  // all previous operations will be rolled back.
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    // 1. Verify that the task exists and belongs to the correct project before proceeding.
    // This is a crucial security and integrity check.
    const taskToDelete = await Task.findOne({
      _id: taskId,
      project: projectId,
    });

    if (!taskToDelete) {
      throw new ApiError(404, "Task not found in this project.");
    }

    // New step: Delete attachments from Cloudinary before deleting the task document
    if (taskToDelete.attachments && taskToDelete.attachments.length > 0) {
      const deletePromises = taskToDelete.attachments.map((att) => {
        if (att.public_id) {
          return deleteOnCloudinary(att.public_id, "auto");
        }
        return Promise.resolve();
      });
      await Promise.all(deletePromises);
    }

    // 2. Delete all subtasks associated with the task.
    await SubTask.deleteMany({ task: taskId }, { session });

    // 3. Delete the task itself.
    await Task.findByIdAndDelete(taskId, { session });

    // 4. If all operations were successful, commit the transaction.
    await session.commitTransaction();

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { _id: taskId },
          "Task and associated subtasks deleted successfully.",
        ),
      );
  } catch (error) {
    // If any error occurs, abort the entire transaction.
    await session.abortTransaction();
    throw error; // Re-throw the error to be handled by the global error handler.
  } finally {
    // Always end the session to release its resources.
    session.endSession();
  }
});

/**
 * @description Update the status of a task
 * @route PATCH /api/v1/tasks/:projectId/:taskId/status
 */
const updateTaskStatus = asyncHandler(async (req, res) => {
  const { projectId, taskId } = req.params;
  const { status } = req.body;

  // 1. Validate the new status to ensure it's a valid choice.
  if (!status || !AvailableTasksStatus.includes(status)) {
    throw new ApiError(400, "A valid task status is required.");
  }

  // 2. Find and update the task's status in one atomic operation.
  // This also ensures the task belongs to the correct project for security.
  const updatedTask = await Task.findOneAndUpdate(
    { _id: taskId, project: projectId },
    { $set: { status } },
    { new: true, runValidators: true },
  )
    .populate("assignedTo", "username fullname email avatar")
    .populate("assignedBy", "username fullname email avatar");

  if (!updatedTask) {
    throw new ApiError(404, "Task not found in this project.");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, updatedTask, "Task status updated successfully."),
    );
});

/**
 * @description Assign a task to a different user
 * @route PATCH /api/v1/tasks/:projectId/:taskId/assign
 */
const assignTask = asyncHandler(async (req, res) => {
  // The `validateProjectPermission` middleware has already confirmed the requesting user is an ADMIN.
  const { projectId, taskId } = req.params;
  const { assignedTo } = req.body; // This should be the user's ID

  // 1. Validate input
  if (!assignedTo) {
    throw new ApiError(400, "User ID to assign is required.");
  }

  if (!mongoose.isValidObjectId(assignedTo)) {
    throw new ApiError(400, "Invalid user ID format.");
  }

  // 2. Verify that the user being assigned is a member of the project.
  const member = await ProjectMember.findOne({
    project: projectId,
    user: assignedTo,
  });

  if (!member) {
    throw new ApiError(
      400,
      "The user you are trying to assign is not a member of this project.",
    );
  }

  // 3. Find and update the task's `assignedTo` field in one atomic operation.
  const updatedTask = await Task.findOneAndUpdate(
    { _id: taskId, project: projectId },
    { $set: { assignedTo } },
    { new: true, runValidators: true },
  )
    .populate("assignedTo", "username fullname email avatar")
    .populate("assignedBy", "username fullname email avatar");

  if (!updatedTask) {
    throw new ApiError(404, "Task not found in this project.");
  }

  // 4. Return the updated task
  return res
    .status(200)
    .json(new ApiResponse(200, updatedTask, "Task assigned successfully."));
});

/**
 * @description Add attachments to a task
 * @route PATCH /api/v1/tasks/:projectId/:taskId/attachments
 */
const addTaskAttachments = asyncHandler(async (req, res) => {
  const { projectId, taskId } = req.params;

  // 1. Check if files were uploaded by multer
  const files = req.files;
  if (!files || files.length === 0) {
    throw new ApiError(400, "No attachment files were provided.");
  }

  // 2. Verify the task exists and belongs to the project
  const task = await Task.findOne({ _id: taskId, project: projectId });
  if (!task) {
    throw new ApiError(404, "Task not found in this project.");
  }

  // 3. Upload each file to Cloudinary (simulated) in parallel
  const attachmentUploadPromises = files.map((file) =>
    uploadOnCloudinary(file.path),
  );
  const uploadResults = await Promise.all(attachmentUploadPromises);

  // 4. Filter out any failed uploads and format the successful ones for the database
  const newAttachments = uploadResults
    .map((result, index) => {
      if (result?.url) {
        return {
          url: result.url,
          public_id: result.public_id, // Store the public_id
          mimetype: files[index].mimetype,
          size: files[index].size,
        };
      }
      return null;
    })
    .filter(Boolean); // Remove nulls from failed uploads

  if (newAttachments.length === 0) {
    throw new ApiError(500, "Error uploading attachments. Please try again.");
  }

  // 5. Add the new attachments to the task's attachments array
  const updatedTask = await Task.findByIdAndUpdate(
    taskId,
    {
      $push: { attachments: { $each: newAttachments } },
    },
    { new: true },
  )
    .populate("assignedTo", "username fullname email avatar")
    .populate("assignedBy", "username fullname email avatar");

  return res
    .status(200)
    .json(new ApiResponse(200, updatedTask, "Attachments added successfully."));
});

/**
 * @description Delete an attachment from a task
 * @route DELETE /api/v1/tasks/:projectId/:taskId/attachments/:attachmentId
 */
const deleteTaskAttachment = asyncHandler(async (req, res) => {
  const { projectId, taskId, attachmentId } = req.params;

  // 1. Find the task and ensure it belongs to the project
  const task = await Task.findOne({ _id: taskId, project: projectId });
  if (!task) {
    throw new ApiError(404, "Task not found in this project.");
  }

  // 2. Find the specific attachment to delete
  const attachment = task.attachments.find(
    (att) => att._id.toString() === attachmentId,
  );

  if (!attachment) {
    throw new ApiError(404, "Attachment not found on this task.");
  }

  // 3. Delete the attachment from Cloudinary
  if (attachment.public_id) {
    await deleteOnCloudinary(attachment.public_id, "auto"); // Use 'auto' for resource_type
  }

  // 4. Remove the attachment from the task's array in the database
  const updatedTask = await Task.findByIdAndUpdate(
    taskId,
    { $pull: { attachments: { _id: attachmentId } } },
    { new: true },
  )
    .populate("assignedTo", "username fullname email avatar")
    .populate("assignedBy", "username fullname email avatar");

  return res
    .status(200)
    .json(
      new ApiResponse(200, updatedTask, "Attachment deleted successfully."),
    );
});

export {
  createTask,
  getTasksInProject,
  getTaskById,
  updateTask,
  deleteTask,
  updateTaskStatus,
  assignTask,
  addTaskAttachments,
  deleteTaskAttachment,
};
