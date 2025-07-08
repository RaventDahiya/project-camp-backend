import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ProjectNote } from "../models/note.models.js";
import { Project } from "../models/project.models.js";
import mongoose from "mongoose";

const getNotes = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const project = await Project.findById(projectId);
  if (!project) {
    throw new ApiError(404, "project not found");
  }
  const notes = await ProjectNote.find({
    project: mongoose.Types.ObjectId(projectId),
  }).populate("createdBy", "username fullname avatar");
  // No need to check for !notes, as find returns an array
  return res
    .status(200)
    .json(new ApiResponse(200, notes, "notes fetched successfully"));
});

const getNoteById = asyncHandler(async (req, res) => {
  const { noteId } = req.params;
  const note = await ProjectNote.findById(noteId).populate(
    "createdBy",
    "username fullname avatar",
  );
  if (!note) {
    throw new ApiError(404, "note not found");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, note, "note fetched successfully"));
});

const createNote = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const { content } = req.body;
  const project = await Project.findById(projectId);
  if (!project) {
    throw new ApiError(404, "project not found");
  }
  const note = await ProjectNote.create({
    project: mongoose.Types.ObjectId(projectId),
    content,
    createdBy: mongoose.Types.ObjectId(req.user._id),
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
  const { noteId } = req.params;
  const { content } = req.body;
  const existingNote = await ProjectNote.findById(noteId);
  if (!existingNote) {
    throw new ApiError(404, "note not found");
  }
  const updatedNote = await ProjectNote.findByIdAndUpdate(
    noteId,
    { content },
    { new: true },
  ).populate("createdBy", "username fullname avatar");
  return res
    .status(200)
    .json(new ApiResponse(200, updatedNote, "note updated successfully"));
});

const deleteNotes = asyncHandler(async (req, res) => {
  const { noteId } = req.params;
  const existingNote = await ProjectNote.findByIdAndDelete(noteId);
  if (!existingNote) {
    throw new ApiError(404, "note not found");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, existingNote, "note deleted successfully"));
});

export { getNotes, getNoteById, createNote, updateNote, deleteNotes };
