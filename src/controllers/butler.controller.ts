import { Response } from "express";
import { butlerService } from "../services/butler.service";
import { AuthRequest } from "../types";

export class ButlerController {
  async consult(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ message: "Not authenticated" });
        return;
      }

      const { current_mood, current_energy, raw_input } = req.body;

      // Validate required fields
      if (!current_mood || current_energy === undefined) {
        res.status(400).json({
          message: "Missing required fields: current_mood and current_energy",
        });
        return;
      }

      // Validate energy range
      if (current_energy < 1 || current_energy > 10) {
        res.status(400).json({
          message: "current_energy must be between 1 and 10",
        });
        return;
      }

      const result = await butlerService.consult(req.user.userId, {
        current_mood,
        current_energy,
        raw_input,
      });

      res.status(200).json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Butler consultation failed";
      res.status(500).json({ message });
    }
  }

  async getHistory(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ message: "Not authenticated" });
        return;
      }

      const limit = parseInt(req.query.limit as string) || 10;
      const history = await butlerService.getHistory(req.user.userId, limit);

      res.status(200).json({ history });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to fetch history";
      res.status(400).json({ message });
    }
  }

  async updateProfile(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ message: "Not authenticated" });
        return;
      }

      const { core_values, baseline_energy } = req.body;

      // Validate baseline_energy if provided
      if (baseline_energy !== undefined && (baseline_energy < 1 || baseline_energy > 10)) {
        res.status(400).json({
          message: "baseline_energy must be between 1 and 10",
        });
        return;
      }

      const profile = await butlerService.updateUserProfile(req.user.userId, {
        core_values,
        baseline_energy,
      });

      res.status(200).json({
        message: "Profile updated successfully",
        profile,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update profile";
      res.status(400).json({ message });
    }
  }
}

export const butlerController = new ButlerController();

