import mongoose, { Schema } from "mongoose";
import { ITask } from "../types";

const taskSchema = new Schema<ITask>(
  {
    title: {
      type: String,
      required: [true, "Task title is required"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    energy_cost: {
      type: Number,
      required: true,
      min: 1,
      max: 10,
      default: 5,
    },
    emotional_friction: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Medium",
    },
    associated_value: {
      type: String,
      trim: true,
    },
    is_completed: {
      type: Boolean,
      default: false,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient querying
taskSchema.index({ user: 1, is_completed: 1 });

export const Task = mongoose.model<ITask>("Task", taskSchema);

