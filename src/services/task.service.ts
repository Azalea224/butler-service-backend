import { Task } from "../models/Task";
import { CreateTaskDTO, UpdateTaskDTO, ITask } from "../types";

export class TaskService {
  async createTask(userId: string, data: CreateTaskDTO): Promise<ITask> {
    const task = await Task.create({
      ...data,
      user: userId,
    });
    return task;
  }

  async getTasks(userId: string, includeCompleted = false): Promise<ITask[]> {
    const query: Record<string, unknown> = { user: userId };
    if (!includeCompleted) {
      query.is_completed = false;
    }
    return Task.find(query).sort({ createdAt: -1 });
  }

  async getTaskById(userId: string, taskId: string): Promise<ITask | null> {
    return Task.findOne({ _id: taskId, user: userId });
  }

  async updateTask(userId: string, taskId: string, data: UpdateTaskDTO): Promise<ITask | null> {
    return Task.findOneAndUpdate(
      { _id: taskId, user: userId },
      { $set: data },
      { new: true, runValidators: true }
    );
  }

  async deleteTask(userId: string, taskId: string): Promise<boolean> {
    const result = await Task.deleteOne({ _id: taskId, user: userId });
    return result.deletedCount > 0;
  }

  async completeTask(userId: string, taskId: string): Promise<ITask | null> {
    return Task.findOneAndUpdate(
      { _id: taskId, user: userId },
      { $set: { is_completed: true } },
      { new: true }
    );
  }

  async getOpenTasksForAI(userId: string) {
    const tasks = await Task.find({ user: userId, is_completed: false });
    return tasks.map((task) => ({
      id: task._id,
      title: task.title,
      description: task.description,
      energy_cost: task.energy_cost,
      emotional_friction: task.emotional_friction,
      associated_value: task.associated_value,
    }));
  }
}

export const taskService = new TaskService();

