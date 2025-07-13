import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ProjectNote } from "../models/note.models.js";
import { Project } from "../models/project.models.js";
import mongoose from "mongoose";

const getNotes = asyncHandler(async (req, res) => {
  // The `validateProjectPermission` middleware has already confirmed the user has access to this project.
  const { projectId } = req.params;
  const notes = await ProjectNote.find({
    project: projectId,
  }).populate("createdBy", "username fullname avatar");
  // No need to check for !notes, as find returns an array
  return res
    .status(200)
    .json(new ApiResponse(200, notes, "notes fetched successfully"));
});

const getNoteById = asyncHandler(async (req, res) => {
  const { projectId, noteId } = req.params;
  // Find the note but ensure it belongs to the project specified in the URL
  const note = await ProjectNote.findOne({
    _id: noteId,
    project: projectId,
  }).populate("createdBy", "username fullname avatar");

  if (!note) {
    // Use a more specific error message
    throw new ApiError(404, "Note not found in this project");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, note, "note fetched successfully"));
});

const createNote = asyncHandler(async (req, res) => {
  // The `validateProjectPermission` middleware has already confirmed the user is an ADMIN of this project.
  const { projectId } = req.params;
  const { content } = req.body;
  const note = await ProjectNote.create({
    project: projectId,
    content,
    createdBy: req.user._id,
  });

  const populatedNote = await ProjectNote.findById(note._id).populate(
    "createdBy",
    "username fullname avatar",
  );
  return res
    .status(201)
    .json(new ApiResponse(201, populatedNote, "note created successfully"));
});

const updateNote = asyncHandler(async (req, res) => {
  const { projectId, noteId } = req.params;
  const { content } = req.body;

  if (!content) {
    throw new ApiError(400, "Content is required for an update.");
  }

  // Find and update the note in one atomic operation,
  // ensuring it belongs to the correct project.
  const updatedNote = await ProjectNote.findOneAndUpdate(
    { _id: noteId, project: projectId },
    { $set: { content } },
    { new: true },
  ).populate("createdBy", "username fullname avatar");

  if (!updatedNote) {
    throw new ApiError(404, "Note not found in this project");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, updatedNote, "note updated successfully"));
});

const deleteNotes = asyncHandler(async (req, res) => {
  const { projectId, noteId } = req.params;

  // Find and delete the note, ensuring it belongs to the correct project.
  const deletedNote = await ProjectNote.findOneAndDelete({
    _id: noteId,
    project: projectId,
  });

  if (!deletedNote) {
    throw new ApiError(404, "Note not found in this project");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, { _id: noteId }, "note deleted successfully"));
});

export { getNotes, getNoteById, createNote, updateNote, deleteNotes };
