import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ProjectNote } from "../models/note.models.js";
import { Project } from "../models/project.models.js";
import mongoose from "mongoose";
import { json } from "express";

const getNotes = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const project = await Project.findById(projectId);
  if (!project) {
    throw new ApiError(404, "project not found");
  }
  const notes = await ProjectNote.find({
    project: new mongoose.Types.ObjectId(projectId),
  }).populate("createdBy", "username fullname avatar");
  if (!notes) {
    throw new ApiError(404, "notes not found");
  }
  return res.status(
    200,
    json(new ApiResponse(200, notes, "notes fetched successfully")),
  );
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
  return res.status(
    200,
    json(new ApiResponse(200, note, "note fetched successfully")),
  );
});

const createNote = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const { content } = req.body;
  const project = await Project.findById(projectId);
  if (!project) {
    throw new ApiError(404, "project not found");
  }
  const note = ProjectNote.create({
    project: new mongoose.Types.ObjectId(projectId),
    content,
    createdBy: new mongoose.Types.ObjectId(req.user._id),
  });

  const populatedNote = await ProjectNote.findById(getNoteById._id).populate(
    "createdBy",
    "username fullname avatar",
  );
  return res.status(
    200,
    json(new ApiResponse(200, note, "note created successfully")),
  );
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
  return res.status(
    200,
    json(new ApiResponse(200, updatedNote, "note updated successfully")),
  );
});

const deleteNotes = asyncHandler(async (req, res) => {
  const { noteId } = req.params;
  const existingNote = await ProjectNote.findByIdAndDelete(noteId);
  if (!existingNote) {
    throw new ApiError(404, "note not found");
  }
  return res.status(
    200,
    json(new ApiResponse(200, existingNote, "note deleted successfully")),
  );
});

export { getNotes, getNoteById, createNote, updateNote, deleteNotes };
