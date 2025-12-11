import mongoose, { Schema } from "mongoose";
import { IChatLog } from "../types";

const chatLogSchema = new Schema<IChatLog>({
  user_id: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  role: {
    type: String,
    enum: ["user", "assistant"],
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  session_id: {
    type: String,
    default: null,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

// Index for querying user chat history
chatLogSchema.index({ user_id: 1, timestamp: -1 });
chatLogSchema.index({ user_id: 1, session_id: 1, timestamp: -1 });

export const ChatLog = mongoose.model<IChatLog>("ChatLog", chatLogSchema);

