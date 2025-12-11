import { User } from "../models/User";
import { ContextLog } from "../models/ContextLog";
import { taskService } from "./task.service";
import { aiService } from "./ai.service";
import { LogMoodDTO, ConsultButlerDTO, ButlerResponse, UserContext, MoodLogEntry } from "../types";

export class ButlerService {
  /**
   * Log mood without triggering AI
   */
  async logMood(userId: string, data: LogMoodDTO): Promise<{ message: string; log_id: string }> {
    const contextLog = await ContextLog.create({
      user_id: userId,
      raw_input: data.raw_input || `Mood: ${data.mood}, Energy: ${data.energy_level}`,
      mood: data.mood,
      current_energy: data.energy_level,
    });

    return {
      message: "Mood logged successfully",
      log_id: contextLog._id.toString(),
    };
  }

  /**
   * Consult AI Butler - fetches recent mood logs automatically
   */
  async consult(userId: string, data: ConsultButlerDTO): Promise<ButlerResponse> {
    // Fetch user profile
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Fetch last 3 mood logs
    const recentLogs = await ContextLog.find({ user_id: userId })
      .sort({ timestamp: -1 })
      .limit(3);

    // Convert to MoodLogEntry format
    const recentMoods: MoodLogEntry[] = recentLogs.map(log => ({
      mood: log.mood,
      energy_level: log.current_energy,
      raw_input: log.raw_input,
      timestamp: log.timestamp,
    }));

    // Build user context for AI
    const userContext: UserContext = {
      username: user.username,
      core_values: user.core_values,
      baseline_energy: user.baseline_energy,
      recent_moods: recentMoods,
      user_message: data.user_message,
    };

    // Get open tasks formatted for AI
    const tasks = await taskService.getOpenTasksForAI(userId);

    // Consult the AI Butler
    const response = await aiService.consultButler(userContext, tasks);

    return response;
  }

  async getHistory(userId: string, limit = 10) {
    return ContextLog.find({ user_id: userId })
      .sort({ timestamp: -1 })
      .limit(limit);
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
      username: user.username,
      email: user.email,
      core_values: user.core_values,
      baseline_energy: user.baseline_energy,
    };
  }
}

export const butlerService = new ButlerService();
