import { Request } from "express";
import { Document, Types } from "mongoose";

// ============ User ============
export interface IUser extends Document {
  _id: string;
  email: string;
  password: string;
  name: string;
  core_values: string[];
  baseline_energy: number;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): boolean;
}

// ============ Task ============
export type EmotionalFriction = "Low" | "Medium" | "High";

export interface ITask extends Document {
  _id: string;
  title: string;
  description?: string;
  energy_cost: number;
  emotional_friction: EmotionalFriction;
  associated_value?: string;
  is_completed: boolean;
  user: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// ============ Context Log ============
export interface IContextLog extends Document {
  _id: string;
  user: Types.ObjectId;
  raw_input: string;
  mood: string;
  current_energy: number;
  ai_response?: string;
  recommended_task?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// ============ JWT ============
export interface JwtPayload {
  userId: string;
  email: string;
}

export interface AuthRequest extends Request {
  user?: JwtPayload;
}

// ============ Auth DTOs ============
export interface RegisterDTO {
  email: string;
  password: string;
  name: string;
  core_values?: string[];
}

export interface LoginDTO {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    name: string;
  };
  token: string;
}

// ============ Task DTOs ============
export interface CreateTaskDTO {
  title: string;
  description?: string;
  energy_cost: number;
  emotional_friction: EmotionalFriction;
  associated_value?: string;
}

export interface UpdateTaskDTO {
  title?: string;
  description?: string;
  energy_cost?: number;
  emotional_friction?: EmotionalFriction;
  associated_value?: string;
  is_completed?: boolean;
}

// ============ Butler DTOs ============
export interface ConsultButlerDTO {
  current_mood: string;
  current_energy: number;
  raw_input?: string;
}

export interface ButlerResponse {
  recommendation: string;
  context_log_id: string;
}

// ============ AI Service Types ============
export interface UserContext {
  name: string;
  core_values: string[];
  baseline_energy: number;
  current_mood: string;
  current_energy: number;
}

export interface TaskForAI {
  id: string;
  title: string;
  description?: string;
  energy_cost: number;
  emotional_friction: EmotionalFriction;
  associated_value?: string;
}

