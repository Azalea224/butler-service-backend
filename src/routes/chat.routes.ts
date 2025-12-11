import { Router } from "express";
import { chatController } from "../controllers/chat.controller";
import { authenticate } from "../middlewares/auth.middleware";

const router = Router();

// All routes require authentication
router.use(authenticate);

// POST /api/chat/message - Send a message and get AI response
router.post("/message", (req, res) => {
  chatController.sendMessage(req, res);
});

// GET /api/chat/history - Get chat history
router.get("/history", (req, res) => {
  chatController.getHistory(req, res);
});

// DELETE /api/chat/history - Clear chat history
router.delete("/history", (req, res) => {
  chatController.clearHistory(req, res);
});

export default router;

