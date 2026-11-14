import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import { initDb, getDb } from "./db.js";
import { hashPassword, comparePassword, signToken } from "./utils/auth.js";
import { authenticate, AuthedRequest } from "./middleware/auth.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(cors());
app.use(express.json());

// Initialize database
initDb();

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Auth Routes
app.post("/api/auth/register", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password || typeof email !== "string" || typeof password !== "string") {
    return res.status(400).json({ error: { message: "Email and password are required" } });
  }

  const dbInfo = getDb();
  if (dbInfo.type !== "sqlite") {
    return res.status(501).json({ error: { message: "Only SQLite dev supported in current config" } });
  }

  try {
    const existing = dbInfo.db.prepare("SELECT id FROM users WHERE email = ?").get(email.toLowerCase().trim());
    if (existing) {
      return res.status(409).json({ error: { message: "Email already registered" } });
    }

    const hashed = await hashPassword(password);
    const result = dbInfo.db.prepare("INSERT INTO users (email, password_hash) VALUES (?, ?)").run(email.toLowerCase().trim(), hashed);
    const userId = Number(result.lastInsertRowid);
    const token = signToken({ userId, email: email.toLowerCase().trim() });

    return res.status(201).json({ user: { id: userId, email }, token });
  } catch (err: any) {
    return res.status(500).json({ error: { message: err.message || "Registration failed" } });
  }
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: { message: "Email and password are required" } });
  }

  const dbInfo = getDb();
  if (dbInfo.type !== "sqlite") {
    return res.status(501).json({ error: { message: "Only SQLite dev supported in current config" } });
  }

  try {
    const user = dbInfo.db.prepare("SELECT * FROM users WHERE email = ?").get(email.toLowerCase().trim());
    if (!user) {
      return res.status(401).json({ error: { message: "Invalid email or password" } });
    }

    const match = await comparePassword(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ error: { message: "Invalid email or password" } });
    }

    const token = signToken({ userId: user.id, email: user.email });
    return res.json({ user: { id: user.id, email: user.email }, token });
  } catch (err: any) {
    return res.status(500).json({ error: { message: err.message || "Login failed" } });
  }
});

app.get("/api/auth/me", authenticate, (req: AuthedRequest, res) => {
  res.json({ user: req.user });
});

// Tasks Routes
app.get("/api/tasks", authenticate, (req: AuthedRequest, res) => {
  const userId = req.user!.userId;
  const dbInfo = getDb();
  if (dbInfo.type === "sqlite") {
    const tasks = dbInfo.db.prepare("SELECT * FROM tasks WHERE user_id = ? ORDER BY id DESC").all(userId);
    res.json({ tasks });
  } else {
    res.status(501).json({ error: { message: "Postgres not configured" } });
  }
});

app.post("/api/tasks", authenticate, (req: AuthedRequest, res) => {
  const userId = req.user!.userId;
  const { title, description, dueDate } = req.body || {};
  if (!title || typeof title !== "string" || !title.trim()) {
    return res.status(400).json({ error: { message: "Title is required" } });
  }

  const dbInfo = getDb();
  if (dbInfo.type === "sqlite") {
    const result = dbInfo.db.prepare(
      "INSERT INTO tasks (user_id, title, description, due_date) VALUES (?, ?, ?, ?)"
    ).run(userId, title.trim(), (description || "").trim(), dueDate || null);

    const task = dbInfo.db.prepare("SELECT * FROM tasks WHERE id = ?").get(result.lastInsertRowid);
    res.status(201).json({ task });
  }
});

app.put("/api/tasks/:id", authenticate, (req: AuthedRequest, res) => {
  const userId = req.user!.userId;
  const taskId = Number(req.params.id);
  const { title, description, dueDate, completed } = req.body || {};

  const dbInfo = getDb();
  if (dbInfo.type === "sqlite") {
    const existing = dbInfo.db.prepare("SELECT * FROM tasks WHERE id = ? AND user_id = ?").get(taskId, userId);
    if (!existing) {
      return res.status(404).json({ error: { message: "Task not found" } });
    }

    dbInfo.db.prepare(`
      UPDATE tasks
      SET title = COALESCE(?, title),
          description = COALESCE(?, description),
          due_date = ?,
          completed = COALESCE(?, completed),
          updated_at = datetime('now')
      WHERE id = ? AND user_id = ?
    `).run(
      title ? title.trim() : null,
      description !== undefined ? description : null,
      dueDate !== undefined ? (dueDate || null) : existing.due_date,
      completed !== undefined ? (completed ? 1 : 0) : null,
      taskId,
      userId
    );

    const updated = dbInfo.db.prepare("SELECT * FROM tasks WHERE id = ?").get(taskId);
    res.json({ task: updated });
  }
});

app.delete("/api/tasks/:id", authenticate, (req: AuthedRequest, res) => {
  const userId = req.user!.userId;
  const taskId = Number(req.params.id);

  const dbInfo = getDb();
  if (dbInfo.type === "sqlite") {
    const result = dbInfo.db.prepare("DELETE FROM tasks WHERE id = ? AND user_id = ?").run(taskId, userId);
    if (result.changes === 0) {
      return res.status(404).json({ error: { message: "Task not found" } });
    }
    res.json({ success: true });
  }
});

app.listen(PORT, () => {
  console.log(`TaskMaster API server running on port ${PORT}`);
});
