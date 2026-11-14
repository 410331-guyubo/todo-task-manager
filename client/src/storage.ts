import { Task, User } from "./types";

const USERS_KEY = "tm_users";
const CURRENT_USER_KEY = "tm_current_user";
const TASKS_KEY = "tm_tasks";

const DEFAULT_DEMO_USER: User = {
  id: 1,
  email: "demo@example.com",
};

const TODAY = new Date().toISOString().slice(0, 10);
const YESTERDAY = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
const TOMORROW = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
const NEXT_WEEK = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);

const INITIAL_TASKS: Task[] = [
  {
    id: 1,
    userId: 1,
    title: "Review Architecture Plan & Database Schema",
    description: "Verify SQLite / PostgreSQL compatibility and JWT auth middleware.",
    completed: true,
    dueDate: YESTERDAY,
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 2,
    userId: 1,
    title: "Complete GitHub Repository Setup & GitHub Pages Deployment",
    description: "Push repository to GitHub, verify .gitignore exclusions, and launch gh-pages.",
    completed: false,
    dueDate: TODAY,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 3,
    userId: 1,
    title: "Implement Task Categorization & Tags (v1.1)",
    description: "Allow organizing tasks by custom labels, color tags, and priority levels.",
    completed: false,
    dueDate: NEXT_WEEK,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 4,
    userId: 1,
    title: "Prepare Sprint Demo Presentation",
    description: "Walkthrough CRUD operations, due date urgency alerts, and user authentication.",
    completed: false,
    dueDate: TOMORROW,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export function getStoredCurrentUser(): User | null {
  try {
    const raw = localStorage.getItem(CURRENT_USER_KEY);
    if (!raw) return DEFAULT_DEMO_USER;
    return JSON.parse(raw);
  } catch {
    return DEFAULT_DEMO_USER;
  }
}

export function setStoredCurrentUser(user: User | null) {
  if (user) {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(CURRENT_USER_KEY);
  }
}

export function getStoredTasks(userId: number): Task[] {
  try {
    const raw = localStorage.getItem(TASKS_KEY);
    if (!raw) {
      localStorage.setItem(TASKS_KEY, JSON.stringify(INITIAL_TASKS));
      return INITIAL_TASKS.filter((t) => t.userId === userId);
    }
    const all: Task[] = JSON.parse(raw);
    return all.filter((t) => t.userId === userId);
  } catch {
    return [];
  }
}

export function saveAllTasks(tasks: Task[]) {
  localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
}

export function getAllTasksRaw(): Task[] {
  try {
    const raw = localStorage.getItem(TASKS_KEY);
    return raw ? JSON.parse(raw) : INITIAL_TASKS;
  } catch {
    return INITIAL_TASKS;
  }
}

export function registerUser(email: string, _password: string): User {
  const usersRaw = localStorage.getItem(USERS_KEY);
  const users: Array<User & { password?: string }> = usersRaw ? JSON.parse(usersRaw) : [DEFAULT_DEMO_USER];
  const existing = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    throw new Error("A user with this email already exists.");
  }
  const newUser: User = {
    id: Date.now(),
    email: email.trim().toLowerCase(),
  };
  users.push(newUser);
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  setStoredCurrentUser(newUser);
  return newUser;
}

export function loginUser(email: string, _password: string): User {
  const usersRaw = localStorage.getItem(USERS_KEY);
  const users: Array<User & { password?: string }> = usersRaw ? JSON.parse(usersRaw) : [DEFAULT_DEMO_USER];
  let user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (!user) {
    // For demo convenience, automatically create account if not found
    user = {
      id: Date.now(),
      email: email.trim().toLowerCase(),
    };
    users.push(user);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }
  setStoredCurrentUser(user);
  return user;
}
