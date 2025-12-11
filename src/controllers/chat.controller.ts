import { Response } from "express";
import { chatService } from "../services/chat.service";
import { AuthRequest } from "../types";

export class ChatController {
  /**
   * Send a message and get AI response
   */
  async sendMessage(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ message: "Not authenticated" });
        return;
      }

      const { message } = req.body;

      if (!message || typeof message !== "string" || message.trim().length === 0) {
        res.status(400).json({ message: "Message is required" });
        return;
      }

      const result = await chatService.sendMessage(req.user.userId, {
        message: message.trim(),
      });

      res.status(200).json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to send message";
      res.status(500).json({ message });
    }
  }

  /**
   * Get chat history
   */
  async getHistory(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ message: "Not authenticated" });
        return;
      }

      const limit = parseInt(req.query.limit as string) || 20;
      const history = await chatService.getHistory(req.user.userId, limit);

      res.status(200).json({ history });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to fetch history";
      res.status(500).json({ message });
    }
  }

  /**
   * Clear chat history
   */
  async clearHistory(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ message: "Not authenticated" });
        return;
      }

      await chatService.clearHistory(req.user.userId);

      res.status(200).json({ message: "Chat history cleared" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to clear history";
      res.status(500).json({ message });
    }
  }
}

export const chatController = new ChatController();

