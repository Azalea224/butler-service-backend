import { Router } from "express";
import { butlerController } from "../controllers/butler.controller";
import { authenticate } from "../middlewares/auth.middleware";

const router = Router();

// All routes require authentication
router.use(authenticate);

// POST /api/butler/consult - Get AI task recommendation
router.post("/consult", (req, res) => {
  butlerController.consult(req, res);
});

// GET /api/butler/history - Get consultation history
router.get("/history", (req, res) => {
  butlerController.getHistory(req, res);
});

// PATCH /api/butler/profile - Update user's Butler profile (core_values, baseline_energy)
router.patch("/profile", (req, res) => {
  butlerController.updateProfile(req, res);
});

export default router;

