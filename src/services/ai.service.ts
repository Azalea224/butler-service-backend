import { genAI, AI_MODEL, BUTLER_SYSTEM_INSTRUCTION } from "../config/ai";
import { UserContext, TaskForAI, ButlerResponse, ChatMessage, ChatContext, ParsedTask } from "../types";
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
      
      // Debug logging
      console.log("AI consultButler raw response:", text ? text.substring(0, 500) : "(empty)");
      
      if (!text) {
        console.error("AI returned empty response");
        return {
          empathy_statement: "I'm here to help you.",
          chosen_task_id: null,
          reasoning: "I had trouble processing, but let's take it easy.",
          micro_step: "Take a moment to breathe and try again.",
        };
      }
      
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
      } else {
        console.error("No JSON found in AI response:", text);
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
          maxOutputTokens: 500,
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
   * Magic Parser - Extract structured task from natural language
   * 
   * Frontend Integration:
   * 1. User speaks -> STT generates text.
   * 2. Frontend sends text to /api/tasks/magic-parse.
   * 3. Frontend receives JSON with parsed task fields.
   * 4. Frontend pre-fills the "Add Task" modal fields with this data for user confirmation.
   */
  async parseTaskInput(rawText: string): Promise<ParsedTask> {
    // Check if API key is configured
    if (!env.GEMINI_API_KEY) {
      console.error("GEMINI_API_KEY is not configured");
      throw new Error("AI service is not configured. Please contact support.");
    }

    const today = new Date();
    const systemInstruction = `You are a data extraction assistant. Your job is to extract task details from a user's spoken sentence.

TODAY'S DATE: ${today.toISOString().split('T')[0]} (use this to calculate relative dates like "tomorrow", "next week", etc.)

OUTPUT FORMAT: JSON only, no markdown, no code fences.
{
  "title": "The core task name (clean, concise)",
  "energy_cost": Number (1-10, default 5 if not specified. 'Hard'/'difficult' = 8, 'Easy'/'quick' = 2, 'exhausting' = 9),
  "emotional_friction": String ('Low', 'Medium', 'High'. Default 'Medium'. 'I hate this'/'dreading' = 'High', 'fun'/'excited' = 'Low'),
  "due_date": ISO date string or null (Extract relative time like 'tomorrow', 'next Friday', 'in 3 days' to full ISO date),
  "associated_value": String or null (Guess the category: Health, Work, Finance, Family, Cleanliness, Social, Personal, Creativity)
}

EXAMPLES:
Input: "Do the taxes on Friday I really hate it"
Output: {"title":"Do taxes","energy_cost":8,"emotional_friction":"High","due_date":"2025-01-17T00:00:00.000Z","associated_value":"Finance"}

Input: "Buy milk"
Output: {"title":"Buy milk","energy_cost":2,"emotional_friction":"Low","due_date":null,"associated_value":"Health"}

Input: "Call mom tomorrow, been putting it off"
Output: {"title":"Call mom","energy_cost":3,"emotional_friction":"Medium","due_date":"2025-01-14T00:00:00.000Z","associated_value":"Family"}

Input: "Need to clean my room this weekend it's so hard to start"
Output: {"title":"Clean room","energy_cost":6,"emotional_friction":"High","due_date":"2025-01-18T00:00:00.000Z","associated_value":"Cleanliness"}`;

    const prompt = `Extract task details from this input. Return valid JSON only.\n\nInput: "${rawText}"`;

    try {
      const response = await genAI.models.generateContent({
        model: AI_MODEL,
        contents: prompt,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.3, // Lower temperature for more consistent extraction
          maxOutputTokens: 300,
        },
      });

      const text = response.text || "";
      
      // Parse JSON response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          
          // Validate and normalize the response
          return {
            title: parsed.title || rawText.slice(0, 50),
            energy_cost: this.clamp(parsed.energy_cost ?? 5, 1, 10),
            emotional_friction: this.validateFriction(parsed.emotional_friction),
            due_date: parsed.due_date || null,
            associated_value: parsed.associated_value || null,
          };
        } catch (parseError) {
          console.error("Failed to parse magic parse response as JSON:", text);
        }
      }

      // Fallback: return basic parsed task
      return {
        title: rawText.slice(0, 50),
        energy_cost: 5,
        emotional_friction: "Medium",
        due_date: null,
        associated_value: null,
      };
    } catch (error: any) {
      console.error("AI Magic Parse Error:", {
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
      
      throw new Error("Failed to parse task. Please try again.");
    }
  }

  /**
   * Helper to clamp a number between min and max
   */
  private clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, Math.round(value)));
  }

  /**
   * Helper to validate emotional friction value
   */
  private validateFriction(value: string): "Low" | "Medium" | "High" {
    const normalized = String(value).toLowerCase();
    if (normalized === "low") return "Low";
    if (normalized === "high") return "High";
    return "Medium";
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
