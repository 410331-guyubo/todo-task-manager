export interface User {
  id: number;
  email: string;
}

export interface Task {
  id: number;
  userId: number;
  title: string;
  description: string;
  completed: boolean;
  dueDate: string | null; // YYYY-MM-DD
  createdAt: string;
  updatedAt: string;
}

export type FilterStatus = "all" | "active" | "completed";
