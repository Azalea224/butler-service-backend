import mongoose, { Schema } from "mongoose";
import { IContextLog } from "../types";

const contextLogSchema = new Schema<IContextLog>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    raw_input: {
      type: String,
      required: true,
    },
    mood: {
      type: String,
      required: true,
    },
    current_energy: {
      type: Number,
      required: true,
      min: 1,
      max: 10,
    },
    ai_response: {
      type: String,
    },
    recommended_task: {
      type: Schema.Types.ObjectId,
      ref: "Task",
    },
  },
  {
    timestamps: true,
  }
);

// Index for querying user history
contextLogSchema.index({ user: 1, createdAt: -1 });

export const ContextLog = mongoose.model<IContextLog>("ContextLog", contextLogSchema);

