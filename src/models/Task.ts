import mongoose, { Schema } from "mongoose";
import { ITask } from "../types";

const taskSchema = new Schema<ITask>(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: [true, "Task title is required"],
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
    due_date: {
      type: Date,
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: false },
  }
);

// Index for efficient querying
taskSchema.index({ user_id: 1, is_completed: 1 });

export const Task = mongoose.model<ITask>("Task", taskSchema);
