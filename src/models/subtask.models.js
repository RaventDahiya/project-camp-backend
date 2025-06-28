import mongoose, { Schema } from "mongoose";

const subtaskSchema = new Schema(
  {
    title: {
      type: String,
      trim: true,
      require: true,
    },
    task: {
      type: Schema.Types.ObjectId,
      ref: "Task",
      require: true,
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      require: true,
    },
  },
  { timestamps: true },
);

export const SubTask = mongoose.model("SubTask", subtaskSchema);
