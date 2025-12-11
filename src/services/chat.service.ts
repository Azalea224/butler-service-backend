import { ChatLog } from "../models/ChatLog";
import { ContextLog } from "../models/ContextLog";
import { Task } from "../models/Task";
import { User } from "../models/User";
import { aiService } from "./ai.service";
import { SendMessageDTO, ChatResponse, ChatMessage, ChatContext } from "../types";

export class ChatService {
  /**
   * Send a message and get AI response
   */
  async sendMessage(userId: string, data: SendMessageDTO): Promise<ChatResponse> {
    // Fetch user
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Fetch last 6 chat messages for context
    const recentChats = await ChatLog.find({ user_id: userId })
      .sort({ timestamp: -1 })
      .limit(6);

    // Reverse to get chronological order
    const chatHistory: ChatMessage[] = recentChats.reverse().map(chat => ({
      role: chat.role,
      message: chat.message,
    }));

    // Fetch latest mood log
    const latestMood = await ContextLog.findOne({ user_id: userId })
      .sort({ timestamp: -1 });

    // Count pending tasks
    const pendingTaskCount = await Task.countDocuments({
      user_id: userId,
      is_completed: false,
    });

    // Build chat context
    const chatContext: ChatContext = {
      username: user.username,
      current_mood: latestMood?.mood,
      current_energy: latestMood?.current_energy,
      pending_task_count: pendingTaskCount,
    };

    // Save user's message to ChatLog
    await ChatLog.create({
      user_id: userId,
      role: "user",
      message: data.message,
    });

    // Get AI response
    const aiResponse = await aiService.chatWithButler(data.message, chatHistory, chatContext);

    // Save AI response to ChatLog
    await ChatLog.create({
      user_id: userId,
      role: "assistant",
      message: aiResponse,
    });

    return {
      response: aiResponse,
    };
  }

  /**
   * Get chat history for a user
   */
  async getHistory(userId: string, limit = 20): Promise<ChatMessage[]> {
    const chats = await ChatLog.find({ user_id: userId })
      .sort({ timestamp: -1 })
      .limit(limit);

    return chats.reverse().map(chat => ({
      role: chat.role,
      message: chat.message,
    }));
  }

  /**
   * Clear chat history for a user
   */
  async clearHistory(userId: string): Promise<void> {
    await ChatLog.deleteMany({ user_id: userId });
  }
}

export const chatService = new ChatService();

