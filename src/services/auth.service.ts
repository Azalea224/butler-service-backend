import jwt, { SignOptions } from "jsonwebtoken";
import { User } from "../models/User";
import { env } from "../config/env";
import { RegisterDTO, LoginDTO, AuthResponse, JwtPayload } from "../types";

export class AuthService {
  async register(data: RegisterDTO): Promise<AuthResponse> {
    const { email, password, name } = data;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new Error("User already exists with this email");
    }

    // Create new user
    const user = await User.create({ email, password, name });

    // Generate token
    const token = this.generateToken({ userId: user._id, email: user.email });

    return {
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
      },
      token,
    };
  }

  async login(data: LoginDTO): Promise<AuthResponse> {
    const { email, password } = data;

    // Find user with password
    const user = await User.findOne({ email }).select("+password");
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
        email: user.email,
        name: user.name,
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
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
    };
  }

  private generateToken(payload: JwtPayload): string {
    return jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN,
    } as SignOptions);
  }
}

export const authService = new AuthService();
