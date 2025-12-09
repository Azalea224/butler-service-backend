import mongoose, { Schema } from "mongoose";
import crypto from "crypto";
import { IUser } from "../types";

const userSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
      trim: true,
      minlength: [3, "Username must be at least 3 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password_hash: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false,
    },
    baseline_energy: {
      type: Number,
      default: 5,
      min: 1,
      max: 10,
    },
    core_values: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: false },
  }
);

// Hash password before saving
userSchema.pre("save", function () {
  if (!this.isModified("password_hash")) return;

  // Simple hash using crypto (for production, use bcrypt)
  this.password_hash = crypto
    .createHash("sha256")
    .update(this.password_hash)
    .digest("hex");
});

// Method to compare passwords
userSchema.methods.comparePassword = function (
  candidatePassword: string
): boolean {
  const hashedCandidate = crypto
    .createHash("sha256")
    .update(candidatePassword)
    .digest("hex");
  return this.password_hash === hashedCandidate;
};

export const User = mongoose.model<IUser>("User", userSchema);
