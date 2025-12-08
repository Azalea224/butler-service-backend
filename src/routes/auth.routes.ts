import { Router } from "express";
import { authController } from "../controllers/auth.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { validateRegister, validateLogin } from "../validators/auth.validator";

const router = Router();

// POST /api/auth/register
router.post("/register", validateRegister, (req, res) => {
  authController.register(req, res);
});

// POST /api/auth/login
router.post("/login", validateLogin, (req, res) => {
  authController.login(req, res);
});

// GET /api/auth/profile (protected)
router.get("/profile", authenticate, (req, res) => {
  authController.getProfile(req, res);
});

export default router;

