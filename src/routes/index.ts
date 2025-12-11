import { Router } from "express";
import authRoutes from "./auth.routes";
import taskRoutes from "./task.routes";
import butlerRoutes from "./butler.routes";
import chatRoutes from "./chat.routes";

const router = Router();

// Health check
router.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "AI Butler API",
    timestamp: new Date().toISOString(),
  });
});

// Mount routes
router.use("/auth", authRoutes);
router.use("/tasks", taskRoutes);
router.use("/butler", butlerRoutes);
router.use("/chat", chatRoutes);

export default router;

