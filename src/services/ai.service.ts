import { genAI, AI_MODEL, BUTLER_SYSTEM_INSTRUCTION } from "../config/ai";
import { UserContext, TaskForAI, ButlerResponse, ChatMessage, ChatContext } from "../types";
import { env } from "../config/env";

export class AIService {
  /**
   * Consult the AI Butler for task recommendations
   */
  async consultButler(userContext: UserContext, tasks: TaskForAI[]): Promise<ButlerResponse> {
    // Check if API key is configured
    if (!env.GEMINI_API_KEY) {
      console.error("GEMINI_API_KEY is not configured");
      throw new Error("AI service is not configured. Please contact support.");
    }

    // Format recent mood logs
    const moodHistory = userContext.recent_moods.length > 0
      ? userContext.recent_moods.map((log, i) => {
          const timeAgo = this.getTimeAgo(log.timestamp);
          return `${i + 1}. Energy: ${log.energy_level}/10, Mood: "${log.mood}"${log.raw_input ? ` - "${log.raw_input}"` : ""} (${timeAgo})`;
        }).join("\n")
      : "No recent mood logs available.";

    // Format tasks for the AI
    const tasksDescription = tasks.length > 0
      ? tasks.map((task) => {
          const dueInfo = task.due_date ? `, Due: ${new Date(task.due_date).toLocaleDateString()}` : "";
          return `- ID: "${task.id}", Title: "${task.title}", Energy Cost: ${task.energy_cost}/10, Friction: ${task.emotional_friction}${task.associated_value ? `, Value: ${task.associated_value}` : ""}${dueInfo}`;
        }).join("\n")
      : "No pending tasks available.";

    // Build the prompt
    const prompt = `
USER PROFILE:
- Username: ${userContext.username}
- Core Values: ${userContext.core_values.length > 0 ? userContext.core_values.join(", ") : "Not specified"}
- Baseline Energy: ${userContext.baseline_energy}/10

RECENT MOOD LOGS (most recent first):
${moodHistory}

PENDING TASKS:
${tasksDescription}
${userContext.user_message ? `\nUSER MESSAGE: "${userContext.user_message}"` : ""}

Based on this information, select ONE task for the user to focus on right now. Return your response as a JSON object.`;

    try {
      const response = await genAI.models.generateContent({
        model: AI_MODEL,
        contents: prompt,
        config: {
          systemInstruction: BUTLER_SYSTEM_INSTRUCTION,
          temperature: 0.7,
          maxOutputTokens: 500,
        },
      });

      const text = response.text || "";
      
      // Parse JSON response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          return {
            empathy_statement: parsed.empathy_statement || "I hear you.",
            chosen_task_id: parsed.chosen_task_id || null,
            reasoning: parsed.reasoning || "Based on your current state.",
            micro_step: parsed.micro_step || "Take a deep breath.",
          };
        } catch (parseError) {
          console.error("Failed to parse AI response as JSON:", text);
        }
      }

      // Fallback response if parsing fails
      return {
        empathy_statement: "I'm here to help you.",
        chosen_task_id: null,
        reasoning: "I had trouble processing, but let's take it easy.",
        micro_step: "Take a moment to breathe and try again.",
      };
    } catch (error: any) {
      console.error("AI Service Error:", {
        message: error?.message,
        status: error?.status,
        statusText: error?.statusText,
        details: error?.response?.data || error?.cause || error,
      });
      
      // Provide more specific error messages
      if (error?.status === 401 || error?.message?.includes("API key")) {
        throw new Error("AI authentication failed. Please check API key configuration.");
      }
      if (error?.status === 429) {
        throw new Error("AI service rate limited. Please try again in a moment.");
      }
      if (error?.status === 404 || error?.message?.includes("model")) {
        throw new Error("AI model not available. Please contact support.");
      }
      
      throw new Error("Failed to consult Simi. Please try again.");
    }
  }

  /**
   * Free-form chat with Simi (not task-focused)
   */
  async chatWithButler(userMessage: string, chatHistory: ChatMessage[], chatContext: ChatContext): Promise<string> {
    // Check if API key is configured
    if (!env.GEMINI_API_KEY) {
      console.error("GEMINI_API_KEY is not configured");
      throw new Error("AI service is not configured. Please contact support.");
    }

    // Build context-aware system instruction for chat mode
    const moodInfo = chatContext.current_mood 
      ? `Their current mood is "${chatContext.current_mood}" with energy level ${chatContext.current_energy}/10.`
      : "You don't have recent mood information for them.";
    
    const taskInfo = chatContext.pending_task_count > 0
      ? `They have ${chatContext.pending_task_count} pending task${chatContext.pending_task_count > 1 ? 's' : ''}.`
      : "They have no pending tasks.";

    const chatSystemInstruction = `You are Simi, a supportive friend and butler. You are chatting with ${chatContext.username}. ${moodInfo} ${taskInfo}

You do not need to push tasks unless they ask. Be a good listener. Keep responses concise (under 3 sentences). Be warm, supportive, and match their energy level - if they seem low energy, be gentle and soft; if they seem energetic, you can be more upbeat.`;

    // Format chat history for the AI
    const conversationHistory = chatHistory.map(msg => 
      `${msg.role === 'user' ? 'User' : 'Simi'}: ${msg.message}`
    ).join('\n');

    // Build the prompt with conversation history
    const prompt = conversationHistory 
      ? `${conversationHistory}\nUser: ${userMessage}\nSimi:`
      : `User: ${userMessage}\nSimi:`;

    try {
      const response = await genAI.models.generateContent({
        model: AI_MODEL,
        contents: prompt,
        config: {
          systemInstruction: chatSystemInstruction,
          temperature: 0.8,
          maxOutputTokens: 200,
        },
      });

      return response.text?.trim() || "I'm here for you. How can I help?";
    } catch (error: any) {
      console.error("AI Chat Error:", {
        message: error?.message,
        status: error?.status,
        details: error?.response?.data || error?.cause || error,
      });
      
      if (error?.status === 401 || error?.message?.includes("API key")) {
        throw new Error("AI authentication failed. Please check API key configuration.");
      }
      if (error?.status === 429) {
        throw new Error("AI service rate limited. Please try again in a moment.");
      }
      
      throw new Error("Failed to chat with Simi. Please try again.");
    }
  }

  /**
   * Helper to format time ago
   */
  private getTimeAgo(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  }
}

export const aiService = new AIService();
