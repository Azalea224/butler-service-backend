import { Task } from "../models/Task";
import { CreateTaskDTO, UpdateTaskDTO, ITask } from "../types";

export class TaskService {
  async createTask(userId: string, data: CreateTaskDTO): Promise<ITask> {
    const task = await Task.create({
      ...data,
      user_id: userId,
    });
    return task;
  }

  async getTasks(userId: string, includeCompleted = false): Promise<ITask[]> {
    const query: Record<string, unknown> = { user_id: userId };
    if (!includeCompleted) {
      query.is_completed = false;
    }
    return Task.find(query).sort({ created_at: -1 });
  }

  async getTaskById(userId: string, taskId: string): Promise<ITask | null> {
    return Task.findOne({ _id: taskId, user_id: userId });
  }

  async updateTask(userId: string, taskId: string, data: UpdateTaskDTO): Promise<ITask | null> {
    return Task.findOneAndUpdate(
      { _id: taskId, user_id: userId },
      { $set: data },
      { new: true, runValidators: true }
    );
  }

  async deleteTask(userId: string, taskId: string): Promise<boolean> {
    const result = await Task.deleteOne({ _id: taskId, user_id: userId });
    return result.deletedCount > 0;
  }

  async completeTask(userId: string, taskId: string): Promise<ITask | null> {
    return Task.findOneAndUpdate(
      { _id: taskId, user_id: userId },
      { $set: { is_completed: true } },
      { new: true }
    );
  }

  async getOpenTasksForAI(userId: string) {
    const tasks = await Task.find({ user_id: userId, is_completed: false });
    return tasks.map((task) => ({
      id: task._id.toString(),
      title: task.title,
      energy_cost: task.energy_cost,
      emotional_friction: task.emotional_friction,
      associated_value: task.associated_value,
      due_date: task.due_date,
    }));
  }
}

export const taskService = new TaskService();
