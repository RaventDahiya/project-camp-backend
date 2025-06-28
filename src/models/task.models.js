import mongoose, { Schema } from "mongoose";
import { AvailableTasksStatus, TasksStatusEnum } from "../utils/constants.js";

const taskSchema = new Schema(
  {
    title: {
      type: String,
      trim: true,
      require: true,
    },
    description: {
      type: String,
    },
    project: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      require: [true, "projrct ref is required"],
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: "User",
      require: true,
    },
    assignedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      require: true,
    },
    status: {
      type: String,
      enum: AvailableTasksStatus,
      default: TasksStatusEnum.TODO,
    },
    attachments: {
      type: [
        {
          url: String,
          mimetype: String,
          size: Number,
        },
      ],
      default: [],
    },
  },
  { timestamps: true },
);

export const Task = mongoose.model("Task", taskSchema);
