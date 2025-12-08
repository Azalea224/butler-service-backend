import mongoose, { Schema } from "mongoose";
import crypto from "crypto";
import { IUser } from "../types";

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false,
    },
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    // AI Butler specific fields
    core_values: {
      type: [String],
      default: [],
    },
    baseline_energy: {
      type: Number,
      default: 5,
      min: 1,
      max: 10,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre("save", function () {
  if (!this.isModified("password")) return;

  // Simple hash using crypto (for production, use bcrypt)
  this.password = crypto
    .createHash("sha256")
    .update(this.password)
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
  return this.password === hashedCandidate;
};

export const User = mongoose.model<IUser>("User", userSchema);
