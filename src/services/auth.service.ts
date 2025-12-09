import jwt, { SignOptions } from "jsonwebtoken";
import { User } from "../models/User";
import { env } from "../config/env";
import { RegisterDTO, LoginDTO, AuthResponse, JwtPayload } from "../types";

export class AuthService {
  async register(data: RegisterDTO): Promise<AuthResponse> {
    const { username, email, password } = data;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });
    if (existingUser) {
      throw new Error("User already exists with this email or username");
    }

    // Create new user (password_hash will be hashed by pre-save hook)
    const user = await User.create({
      username,
      email,
      password_hash: password,
      core_values: data.core_values || [],
    });

    // Generate token
    const token = this.generateToken({ userId: user._id, email: user.email });

    return {
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
      token,
    };
  }

  async login(data: LoginDTO): Promise<AuthResponse> {
    const { email, password } = data;

    // Find user with password_hash
    const user = await User.findOne({ email }).select("+password_hash");
    if (!user) {
      throw new Error("Invalid email or password");
    }

    // Check password
    const isMatch = user.comparePassword(password);
    if (!isMatch) {
      throw new Error("Invalid email or password");
    }

    // Generate token
    const token = this.generateToken({ userId: user._id, email: user.email });

    return {
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
      token,
    };
  }

  async getProfile(userId: string) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    return {
      id: user._id,
      username: user.username,
      email: user.email,
      baseline_energy: user.baseline_energy,
      core_values: user.core_values,
      created_at: user.created_at,
    };
  }

  private generateToken(payload: JwtPayload): string {
    return jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN,
    } as SignOptions);
  }
}

export const authService = new AuthService();
