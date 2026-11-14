import React, { useState, useEffect, useMemo } from "react";
import { User, Task, FilterStatus } from "./types";
import {
  getStoredCurrentUser,
  setStoredCurrentUser,
  getStoredTasks,
  saveAllTasks,
  getAllTasksRaw,
  loginUser,
  registerUser,
} from "./storage";

export function App() {
  const [user, setUser] = useState<User | null>(() => getStoredCurrentUser());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Auth form states
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");

  // Load tasks for current user
  useEffect(() => {
    if (user) {
      setTasks(getStoredTasks(user.id));
    } else {
      setTasks([]);
    }
  }, [user]);

  // Sync tasks changes back to global storage
  const updateTasks = (newTasks: Task[]) => {
    setTasks(newTasks);
    if (!user) return;
    const all = getAllTasksRaw();
    const otherTasks = all.filter((t) => t.userId !== user.id);
    saveAllTasks([...otherTasks, ...newTasks]);
  };

  // Auth handlers
  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    if (!authEmail.trim() || !authPassword.trim()) {
      setAuthError("Please fill in both email and password.");
      return;
    }
    try {
      let loggedUser: User;
      if (authMode === "register") {
        loggedUser = registerUser(authEmail, authPassword);
      } else {
        loggedUser = loginUser(authEmail, authPassword);
      }
      setUser(loggedUser);
      setAuthEmail("");
      setAuthPassword("");
    } catch (err: any) {
      setAuthError(err.message || "Authentication failed");
    }
  };

  const handleQuickDemoLogin = () => {
    const demo = loginUser("demo@example.com", "password123");
    setUser(demo);
  };

  const handleLogout = () => {
    setStoredCurrentUser(null);
    setUser(null);
  };

  // Task actions
  const handleCreateOrUpdateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !user) return;

    if (editingTask) {
      const updated = tasks.map((t) =>
        t.id === editingTask.id
          ? {
              ...t,
              title: title.trim(),
              description: description.trim(),
              dueDate: dueDate || null,
              updatedAt: new Date().toISOString(),
            }
          : t
      );
      updateTasks(updated);
      setEditingTask(null);
    } else {
      const newTask: Task = {
        id: Date.now(),
        userId: user.id,
        title: title.trim(),
        description: description.trim(),
        completed: false,
        dueDate: dueDate || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      updateTasks([newTask, ...tasks]);
    }

    setTitle("");
    setDescription("");
    setDueDate("");
  };

  const handleToggleComplete = (taskId: number) => {
    const updated = tasks.map((t) =>
      t.id === taskId
        ? { ...t, completed: !t.completed, updatedAt: new Date().toISOString() }
        : t
    );
    updateTasks(updated);
  };

  const handleDeleteTask = (taskId: number) => {
    if (window.confirm("Are you sure you want to delete this task?")) {
      const updated = tasks.filter((t) => t.id !== taskId);
      updateTasks(updated);
      if (editingTask?.id === taskId) {
        setEditingTask(null);
        setTitle("");
        setDescription("");
        setDueDate("");
      }
    }
  };

  const handleStartEdit = (t: Task) => {
    setEditingTask(t);
    setTitle(t.title);
    setDescription(t.description || "");
    setDueDate(t.dueDate || "");
    window.scrollTo({ top: 120, behavior: "smooth" });
  };

  const handleCancelEdit = () => {
    setEditingTask(null);
    setTitle("");
    setDescription("");
    setDueDate("");
  };

  // Due date status calculator
  const getDueBadge = (dueDateStr: string | null, completed: boolean) => {
    if (!dueDateStr) return null;
    if (completed) {
      return <span className="badge badge-neutral">✓ {dueDateStr}</span>;
    }
    const today = new Date().toISOString().slice(0, 10);
    if (dueDateStr < today) {
      return <span className="badge badge-overdue">⚠ Overdue ({dueDateStr})</span>;
    }
    if (dueDateStr === today) {
      return <span className="badge badge-today">⏰ Due Today</span>;
    }
    return <span className="badge badge-upcoming">📅 Due {dueDateStr}</span>;
  };

  // Filtered tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (filter === "active" && t.completed) return false;
      if (filter === "completed" && !t.completed) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = t.title.toLowerCase().includes(q);
        const matchDesc = t.description?.toLowerCase().includes(q);
        return matchTitle || matchDesc;
      }
      return true;
    });
  }, [tasks, filter, searchQuery]);

  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.completed).length;
    const active = total - completed;
    return { total, active, completed };
  }, [tasks]);

  // If user is not logged in, show Auth Screen
  if (!user) {
    return (
      <div className="app-container">
        <div className="glass-panel auth-container">
          <div className="auth-header">
            <div className="brand-icon" style={{ margin: "0 auto 1rem auto" }}>✓</div>
            <h1 className="brand-title" style={{ fontSize: "1.6rem" }}>TaskMaster</h1>
            <p className="brand-subtitle">Smart Todo & Productivity Manager</p>
          </div>

          <div className="auth-tabs">
            <button
              className={`auth-tab ${authMode === "login" ? "active" : ""}`}
              onClick={() => { setAuthMode("login"); setAuthError(""); }}
            >
              Sign In
            </button>
            <button
              className={`auth-tab ${authMode === "register" ? "active" : ""}`}
              onClick={() => { setAuthMode("register"); setAuthError(""); }}
            >
              Create Account
            </button>
          </div>

          {authError && (
            <div style={{ color: "#ef4444", fontSize: "0.85rem", marginBottom: "1rem", textAlign: "center" }}>
              {authError}
            </div>
          )}

          <form onSubmit={handleAuthSubmit}>
            <div className="auth-input-group">
              <label className="auth-label">Email Address</label>
              <input
                type="email"
                className="form-input"
                placeholder="you@domain.com"
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                required
              />
            </div>
            <div className="auth-input-group">
              <label className="auth-label">Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn-primary" style={{ width: "100%", marginTop: "0.5rem" }}>
              {authMode === "login" ? "Sign In" : "Register"}
            </button>
          </form>

          <div style={{ marginTop: "1.25rem", textAlign: "center" }}>
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>or explore directly:</span>
            <button
              onClick={handleQuickDemoLogin}
              className="btn-secondary"
              style={{ width: "100%", marginTop: "0.5rem", padding: "0.55rem" }}
            >
              🚀 Continue as Demo Guest
            </button>
          </div>

          <div className="auth-footer">
            Designed for high performance • Standalone & Backend ready
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="brand-wrapper">
          <div className="brand-icon">✓</div>
          <div>
            <h1 className="brand-title">TaskMaster</h1>
            <p className="brand-subtitle">Todo & Productivity Suite</p>
          </div>
        </div>
        <div className="user-badge">
          <span className="user-email">{user.email}</span>
          <button className="btn-secondary" onClick={handleLogout} title="Sign Out">
            Sign Out
          </button>
        </div>
      </header>

      {/* Stats Ribbon */}
      <div className="stats-grid">
        <div className="glass-panel stat-card">
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">Total Tasks</div>
        </div>
        <div className="glass-panel stat-card">
          <div className="stat-value" style={{ color: "#818cf8" }}>{stats.active}</div>
          <div className="stat-label">In Progress</div>
        </div>
        <div className="glass-panel stat-card">
          <div className="stat-value" style={{ color: "#34d399" }}>{stats.completed}</div>
          <div className="stat-label">Completed</div>
        </div>
      </div>

      {/* Task Creation / Edit Form */}
      <section className="glass-panel task-form-panel">
        <h2 className="form-title">
          {editingTask ? "✏️ Edit Task" : "✨ Create New Task"}
        </h2>
        <form onSubmit={handleCreateOrUpdateTask}>
          <div className="form-row">
            <input
              type="text"
              className="form-input"
              placeholder="What needs to be done? (e.g. Complete sprint report)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
            <input
              type="date"
              className="form-input"
              style={{ maxWidth: "200px" }}
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              title="Optional due date"
            />
          </div>
          <div className="form-row">
            <textarea
              className="form-textarea"
              placeholder="Add extra details, checklist items or notes (optional)..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
            {editingTask && (
              <button type="button" className="btn-secondary" onClick={handleCancelEdit}>
                Cancel
              </button>
            )}
            <button type="submit" className="btn-primary">
              {editingTask ? "Save Changes" : "+ Add Task"}
            </button>
          </div>
        </form>
      </section>

      {/* Search & Filters */}
      <div className="toolbar">
        <div className="filter-group">
          <button
            className={`filter-btn ${filter === "all" ? "active" : ""}`}
            onClick={() => setFilter("all")}
          >
            All ({stats.total})
          </button>
          <button
            className={`filter-btn ${filter === "active" ? "active" : ""}`}
            onClick={() => setFilter("active")}
          >
            Active ({stats.active})
          </button>
          <button
            className={`filter-btn ${filter === "completed" ? "active" : ""}`}
            onClick={() => setFilter("completed")}
          >
            Completed ({stats.completed})
          </button>
        </div>

        <div className="search-box">
          <input
            type="text"
            className="search-input"
            placeholder="🔍 Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Task List */}
      <main className="task-list">
        {filteredTasks.length === 0 ? (
          <div className="glass-panel empty-state">
            <div className="empty-icon">📂</div>
            <h3>No tasks found</h3>
            <p style={{ marginTop: "0.3rem" }}>
              {searchQuery
                ? "No tasks match your search filter."
                : filter === "completed"
                ? "No completed tasks yet. Finish a task to see it here!"
                : "Your todo list is empty. Add a task above to get started!"}
            </p>
          </div>
        ) : (
          filteredTasks.map((t) => (
            <div
              key={t.id}
              className={`glass-panel task-item ${t.completed ? "completed" : ""}`}
            >
              <div className="task-checkbox-wrap">
                <input
                  type="checkbox"
                  className="task-checkbox"
                  checked={t.completed}
                  onChange={() => handleToggleComplete(t.id)}
                  title={t.completed ? "Mark as active" : "Mark as completed"}
                />
              </div>

              <div className="task-body">
                <div className={`task-title ${t.completed ? "done" : ""}`}>
                  {t.title}
                </div>
                {t.description && (
                  <p className="task-desc">{t.description}</p>
                )}
                <div className="task-meta">
                  {getDueBadge(t.dueDate, t.completed)}
                  <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                    Added {new Date(t.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="task-actions">
                <button
                  className="icon-btn"
                  onClick={() => handleStartEdit(t)}
                  title="Edit task"
                >
                  ✏️
                </button>
                <button
                  className="icon-btn delete"
                  onClick={() => handleDeleteTask(t.id)}
                  title="Delete task"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))
        )}
      </main>
    </div>
  );
}
export default App;
