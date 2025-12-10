import { genAI, AI_MODEL, BUTLER_SYSTEM_INSTRUCTION } from "../config/ai";
import { UserContext, TaskForAI } from "../types";
import { env } from "../config/env";

export class AIService {
  /**
   * Consult the AI Butler for task recommendations
   */
  async consultButler(userContext: UserContext, tasks: TaskForAI[]): Promise<string> {
    // Format tasks for the AI
    const tasksDescription = tasks.length > 0
      ? tasks.map((task, i) => {
          const dueInfo = task.due_date ? `, Due: ${new Date(task.due_date).toLocaleDateString()}` : "";
          return `${i + 1}. "${task.title}" - Energy: ${task.energy_cost}/10, Friction: ${task.emotional_friction}${task.associated_value ? `, Value: ${task.associated_value}` : ""}${dueInfo}`;
        }).join("\n")
      : "No pending tasks available.";

    // Build the prompt
    const prompt = `
User Profile:
- Username: ${userContext.username}
- Core Values: ${userContext.core_values.length > 0 ? userContext.core_values.join(", ") : "Not specified"}
- Baseline Energy: ${userContext.baseline_energy}/10

Current State:
- Mood: ${userContext.current_mood}
- Energy Level: ${userContext.current_energy}/10

Pending Tasks:
${tasksDescription}

Based on this information, what ONE task should they focus on right now?`;

    // Check if API key is configured
    if (!env.GEMINI_API_KEY) {
      console.error("GEMINI_API_KEY is not configured");
      throw new Error("AI service is not configured. Please contact support.");
    }

    try {
      const response = await genAI.models.generateContent({
        model: AI_MODEL,
        contents: prompt,
        config: {
          systemInstruction: BUTLER_SYSTEM_INSTRUCTION,
          temperature: 0.7,
          maxOutputTokens: 300,
        },
      });

      return response.text || "I'm having trouble thinking right now. Perhaps take a moment to breathe, and we can try again.";
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
      
      throw new Error("Failed to consult the Butler. Please try again.");
    }
  }

  /**
   * Analyze mood from raw input (optional enhancement)
   */
  async analyzeMood(rawInput: string): Promise<{ mood: string; energy_estimate: number }> {
    const prompt = `Analyze this brief statement and extract the mood and estimated energy level.
    
Statement: "${rawInput}"

Respond in JSON format only:
{"mood": "one or two word mood description", "energy_estimate": number from 1-10}`;

    try {
      const response = await genAI.models.generateContent({
        model: AI_MODEL,
        contents: prompt,
        config: {
          temperature: 0.3,
          maxOutputTokens: 100,
        },
      });

      const text = response.text || '{"mood": "neutral", "energy_estimate": 5}';
      // Extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return { mood: "neutral", energy_estimate: 5 };
    } catch (error) {
      console.error("Mood analysis error:", error);
      return { mood: "unknown", energy_estimate: 5 };
    }
  }
}

export const aiService = new AIService();
