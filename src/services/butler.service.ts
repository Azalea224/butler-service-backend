import { User } from "../models/User";
import { ContextLog } from "../models/ContextLog";
import { taskService } from "./task.service";
import { aiService } from "./ai.service";
import { ConsultButlerDTO, ButlerResponse, UserContext } from "../types";

export class ButlerService {
  async consult(userId: string, data: ConsultButlerDTO): Promise<ButlerResponse> {
    // Fetch user profile
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Build user context for AI
    const userContext: UserContext = {
      name: user.name,
      core_values: user.core_values,
      baseline_energy: user.baseline_energy,
      current_mood: data.current_mood,
      current_energy: data.current_energy,
    };

    // Get open tasks formatted for AI
    const tasks = await taskService.getOpenTasksForAI(userId);

    // Consult the AI Butler
    const recommendation = await aiService.consultButler(userContext, tasks);

    // Log this consultation
    const contextLog = await ContextLog.create({
      user: userId,
      raw_input: data.raw_input || `Mood: ${data.current_mood}, Energy: ${data.current_energy}`,
      mood: data.current_mood,
      current_energy: data.current_energy,
      ai_response: recommendation,
    });

    return {
      recommendation,
      context_log_id: contextLog._id,
    };
  }

  async getHistory(userId: string, limit = 10) {
    return ContextLog.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate("recommended_task", "title");
  }

  async updateUserProfile(userId: string, updates: { core_values?: string[]; baseline_energy?: number }) {
    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updates },
      { new: true, runValidators: true }
    );
    if (!user) {
      throw new Error("User not found");
    }
    return {
      id: user._id,
      name: user.name,
      email: user.email,
      core_values: user.core_values,
      baseline_energy: user.baseline_energy,
    };
  }
}

export const butlerService = new ButlerService();

