import mongoose, { Schema } from "mongoose";
import { IContextLog } from "../types";

const contextLogSchema = new Schema<IContextLog>({
  user_id: {
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
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

// Index for querying user history
contextLogSchema.index({ user_id: 1, timestamp: -1 });

export const ContextLog = mongoose.model<IContextLog>("ContextLog", contextLogSchema);
