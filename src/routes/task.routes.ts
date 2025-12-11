import { Router } from "express";
import { taskController } from "../controllers/task.controller";
import { authenticate } from "../middlewares/auth.middleware";

const router = Router();

// All routes require authentication
router.use(authenticate);

// POST /api/tasks/magic-parse - Parse natural language into task structure
// Frontend Integration:
// 1. User speaks -> STT generates text.
// 2. Frontend sends text to /api/tasks/magic-parse.
// 3. Frontend receives JSON with parsed task fields.
// 4. Frontend pre-fills the "Add Task" modal fields with this data for user confirmation.
router.post("/magic-parse", (req, res) => {
  taskController.magicParse(req, res);
});

// POST /api/tasks - Create a new task
router.post("/", (req, res) => {
  taskController.create(req, res);
});

// GET /api/tasks - Get all tasks (query: ?includeCompleted=true)
router.get("/", (req, res) => {
  taskController.getAll(req, res);
});

// GET /api/tasks/:id - Get a single task
router.get("/:id", (req, res) => {
  taskController.getOne(req, res);
});

// PUT /api/tasks/:id - Update a task
router.put("/:id", (req, res) => {
  taskController.update(req, res);
});

// DELETE /api/tasks/:id - Delete a task
router.delete("/:id", (req, res) => {
  taskController.delete(req, res);
});

// PATCH /api/tasks/:id/complete - Mark task as complete
router.patch("/:id/complete", (req, res) => {
  taskController.complete(req, res);
});

export default router;

