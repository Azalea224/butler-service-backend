import { Request } from "express";
import { Document, Types } from "mongoose";

// ============ User ============
export interface IUser extends Document {
  username: string;
  email: string;
  password_hash: string;
  baseline_energy: number;
  core_values: string[];
  created_at: Date;
  comparePassword(candidatePassword: string): boolean;
}

// ============ Task ============
export type EmotionalFriction = "Low" | "Medium" | "High";

export interface ITask extends Document {
  user_id: Types.ObjectId;
  title: string;
  energy_cost: number;
  emotional_friction: EmotionalFriction;
  associated_value?: string;
  is_completed: boolean;
  due_date?: Date;
  created_at: Date;
}

// ============ Context Log ============
export interface IContextLog extends Document {
  user_id: Types.ObjectId;
  raw_input: string;
  mood: string;
  current_energy: number;
  timestamp: Date;
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
  username: string;
  email: string;
  password: string;
  core_values?: string[];
}

export interface LoginDTO {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: {
    id: string;
    username: string;
    email: string;
  };
  token: string;
}

// ============ Task DTOs ============
export interface CreateTaskDTO {
  title: string;
  energy_cost: number;
  emotional_friction: EmotionalFriction;
  associated_value?: string;
  due_date?: Date;
}

export interface UpdateTaskDTO {
  title?: string;
  energy_cost?: number;
  emotional_friction?: EmotionalFriction;
  associated_value?: string;
  is_completed?: boolean;
  due_date?: Date;
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
  username: string;
  core_values: string[];
  baseline_energy: number;
  current_mood: string;
  current_energy: number;
}

export interface TaskForAI {
  id: string;
  title: string;
  energy_cost: number;
  emotional_friction: EmotionalFriction;
  associated_value?: string;
  due_date?: Date;
}
