import { Response } from "express";
import { taskService } from "../services/task.service";
import { AuthRequest } from "../types";

export class TaskController {
  async create(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ message: "Not authenticated" });
        return;
      }

      const task = await taskService.createTask(req.user.userId, req.body);
      res.status(201).json({
        message: "Task created successfully",
        task,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create task";
      res.status(400).json({ message });
    }
  }

  async getAll(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ message: "Not authenticated" });
        return;
      }

      const includeCompleted = req.query.includeCompleted === "true";
      const tasks = await taskService.getTasks(req.user.userId, includeCompleted);
      res.status(200).json({ tasks });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to fetch tasks";
      res.status(400).json({ message });
    }
  }

  async getOne(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ message: "Not authenticated" });
        return;
      }

      const task = await taskService.getTaskById(req.user.userId, req.params.id);
      if (!task) {
        res.status(404).json({ message: "Task not found" });
        return;
      }
      res.status(200).json({ task });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to fetch task";
      res.status(400).json({ message });
    }
  }

  async update(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ message: "Not authenticated" });
        return;
      }

      const task = await taskService.updateTask(req.user.userId, req.params.id, req.body);
      if (!task) {
        res.status(404).json({ message: "Task not found" });
        return;
      }
      res.status(200).json({
        message: "Task updated successfully",
        task,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update task";
      res.status(400).json({ message });
    }
  }

  async delete(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ message: "Not authenticated" });
        return;
      }

      const deleted = await taskService.deleteTask(req.user.userId, req.params.id);
      if (!deleted) {
        res.status(404).json({ message: "Task not found" });
        return;
      }
      res.status(200).json({ message: "Task deleted successfully" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete task";
      res.status(400).json({ message });
    }
  }

  async complete(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ message: "Not authenticated" });
        return;
      }

      const task = await taskService.completeTask(req.user.userId, req.params.id);
      if (!task) {
        res.status(404).json({ message: "Task not found" });
        return;
      }
      res.status(200).json({
        message: "Task completed! Great job! 🎉",
        task,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to complete task";
      res.status(400).json({ message });
    }
  }
}

export const taskController = new TaskController();

