# 📋 TaskMaster — Todo & Task Manager

> **Live Demo on GitHub Pages**: [https://410331-guyubo.github.io/todo-task-manager/](https://410331-guyubo.github.io/todo-task-manager/)

An elegant, modern task and productivity manager built with **React 18 + TypeScript + Vite** for the frontend, and **Node.js / Express** with **SQLite / PostgreSQL** for the backend.

---

## ✨ Features

- **Intuitive Task CRUD**: Create, view, edit, and delete tasks in real-time.
- **Smart Due Dates & Urgency Badges**:
  - 🚨 **Overdue**: Immediate visual alert for missed deadlines.
  - ⏰ **Due Today**: Focus on what needs to get done today.
  - 📅 **Upcoming**: Keep track of scheduled deadlines.
- **Filter & Search**:
  - Filter across **All**, **Active (In Progress)**, and **Completed**.
  - Fast instant text search by title or description.
- **User Authentication**:
  - Multi-user authentication support (JWT-based backend auth & persistent client storage).
  - One-click **Demo Guest Mode** to instantly explore and test the application on GitHub Pages.
- **Responsive & Modern UI**:
  - Dark glassmorphism interface with fluid animations and responsive mobile/desktop layouts.

---

## 🛠️ Architecture & Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, TypeScript, Vite, CSS Modules / Modern Variables |
| **Backend** | Node.js, Express, TypeScript, Zod, JWT (`jsonwebtoken`), bcryptjs |
| **Database** | SQLite (`better-sqlite3`) for local/dev, PostgreSQL (`pg`) for production |
| **Hosting** | **GitHub Pages** (Frontend SPA) + Render / Railway (Backend API) |

---

## 🚀 Quick Start (Local Development)

### 1. Clone the repository
```bash
git clone https://github.com/410331-guyubo/todo-task-manager.git
cd todo-task-manager
```

### 2. Run Frontend
```bash
cd client
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 3. Run Backend (Optional for standalone mode)
```bash
cd ../server
npm install
npm run dev
```
Backend API will start at [http://localhost:3000](http://localhost:3000).

---

## 🌐 GitHub Pages Deployment

The static build is automatically deployed to the `gh-pages` branch using Vite.

```bash
cd client
npm run build
# The build output is in client/dist/
```

Live website: [https://410331-guyubo.github.io/todo-task-manager/](https://410331-guyubo.github.io/todo-task-manager/)

---

## 📄 License

MIT License.
