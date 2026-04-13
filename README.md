# 🔍 Lost & Found Portal v2.0
**Full Stack · HTML + CSS + JS · Node.js · Express · MongoDB**

---

## 📁 Project Structure

```
lost-found-portal/
│
├── backend/                      ← Node.js + Express API
│   ├── server.js                 ← Entry point
│   ├── db.js                     ← MongoDB connection
│   ├── .env                      ← Environment variables ⚠️ Edit this first
│   ├── package.json
│   ├── middleware/
│   │   ├── auth.js               ← JWT auth + admin guard
│   │   ├── errorHandler.js       ← Central error handler
│   │   └── upload.js             ← Multer image upload
│   ├── models/
│   │   ├── User.js               ← User schema (bcrypt hashed passwords)
│   │   ├── Item.js               ← Lost/Found item schema
│   │   └── Message.js            ← Contact message schema
│   ├── routes/
│   │   ├── auth.js               ← /api/auth/*
│   │   ├── items.js              ← /api/items/*
│   │   ├── messages.js           ← /api/messages/*
│   │   └── admin.js              ← /api/admin/*
│   └── utils/
│       └── seed.js               ← Database seeder
│
├── frontend/                     ← Static HTML website
│   ├── index.html                ← Homepage
│   ├── css/
│   │   └── style.css             ← All shared styles
│   ├── js/
│   │   └── api.js                ← All fetch() calls + UI helpers
│   └── pages/
│       ├── login.html            ← Sign in / Register
│       ├── search.html           ← Browse & filter items
│       ├── post.html             ← Post lost or found item
│       ├── contact.html          ← Contact page
│       └── admin.html            ← Admin panel
│
└── uploads/                      ← Auto-created — stores uploaded images
```

---

## 🚀 Setup Instructions (Step by Step)

### ✅ Prerequisites
Make sure you have installed:
- **Node.js** v18+ → https://nodejs.org
- **MongoDB** (choose one):
  - **Local:** https://www.mongodb.com/try/download/community
  - **Cloud (free):** https://www.mongodb.com/atlas (MongoDB Atlas)

---

### Step 1 — Clone / Extract the Project
```bash
# Extract the zip and navigate into the backend folder
cd lost-found-portal/backend
```

---

### Step 2 — Configure Environment Variables
Open `backend/.env` and edit:

```env
# For LOCAL MongoDB:
MONGO_URI=mongodb://localhost:27017/lostfound

# For MongoDB ATLAS (cloud):
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/lostfound

PORT=5000
JWT_SECRET=any_long_random_string_here
JWT_EXPIRE=7d
```

> **MongoDB Atlas Setup (if using cloud):**
> 1. Go to https://www.mongodb.com/atlas → Create free account
> 2. Create a free **M0 cluster**
> 3. Database Access → Add a user with password
> 4. Network Access → Allow IP `0.0.0.0/0` (anywhere)
> 5. Connect → Drivers → Copy the connection string → paste into `.env`

---

### Step 3 — Install Dependencies
```bash
cd backend
npm install
```

---

### Step 4 — Seed the Database (optional but recommended)
This creates sample users and items so you can test immediately:
```bash
npm run seed
```

Seed output:
```
✅ MongoDB Connected: localhost
Created 6 users
Created 10 items
✅ Seed complete!

Login credentials:
  Admin : admin@college.edu  / admin123
  User  : arjun@college.edu  / pass123
          priya@college.edu  / pass123
```

---

### Step 5 — Start the Server
```bash
# Production:
npm start

# Development (auto-restarts on file changes):
npm run dev
```

You should see:
```
✅ MongoDB Connected: localhost
🚀 Server running → http://localhost:5000
📁 Frontend      → http://localhost:5000
🔗 API           → http://localhost:5000/api
```

---

### Step 6 — Open the Website
Open your browser and go to:

```
http://localhost:5000
```

That's it! The server serves both the API and the frontend.

---

## 🔗 API Reference

### Auth
| Method | Endpoint           | Auth | Body / Params |
|--------|--------------------|------|---------------|
| POST   | /api/auth/register | No   | `{ name, email, password, phone? }` |
| POST   | /api/auth/login    | No   | `{ email, password }` |
| GET    | /api/auth/me       | Yes  | — |
| PUT    | /api/auth/profile  | Yes  | `{ name?, phone? }` |

### Items
| Method | Endpoint                    | Auth  | Notes |
|--------|-----------------------------|-------|-------|
| GET    | /api/items                  | No    | `?search=&type=&category=&status=&page=&limit=&sort=` |
| GET    | /api/items/stats            | No    | Returns `{ lost, found, resolved, total }` |
| GET    | /api/items/my               | Yes   | Current user's posts |
| GET    | /api/items/:id              | No    | Increments view count |
| POST   | /api/items                  | Yes   | FormData with optional `image` file |
| PATCH  | /api/items/:id/resolve      | Yes   | Owner or admin only |
| DELETE | /api/items/:id              | Yes   | Owner or admin only |

### Messages
| Method | Endpoint              | Auth | Notes |
|--------|-----------------------|------|-------|
| POST   | /api/messages         | Yes  | `{ itemId, message }` |
| GET    | /api/messages/inbox   | Yes  | — |
| PATCH  | /api/messages/:id/read| Yes  | — |

### Admin (admin role only)
| Method | Endpoint            | Notes |
|--------|---------------------|-------|
| GET    | /api/admin/stats    | All platform statistics |
| GET    | /api/admin/users    | All registered users |
| DELETE | /api/admin/users/:id| Delete user + their posts |
| GET    | /api/admin/items    | All items with filters |

---

## 🔐 Roles & Permissions

| Action              | Guest | User | Admin |
|---------------------|-------|------|-------|
| Browse items        | ✅    | ✅   | ✅    |
| Search & filter     | ✅    | ✅   | ✅    |
| Post item           | ❌    | ✅   | ✅    |
| Contact owner       | ❌    | ✅   | ✅    |
| Delete own post     | ❌    | ✅   | ✅    |
| Resolve own post    | ❌    | ✅   | ✅    |
| Delete any post     | ❌    | ❌   | ✅    |
| Access Admin Panel  | ❌    | ❌   | ✅    |
| Delete users        | ❌    | ❌   | ✅    |

> **Admin account:** Register with any email containing `admin`, e.g. `admin@college.edu`

---

## 🛡️ Validation Summary

**Frontend:** All forms validate before submit — required fields, email format, password length, password match, file size (max 5MB), character limits.

**Backend:** express-validator on all POST/PUT routes, Mongoose schema validation on all models, JWT authentication on protected routes, file type/size validation in Multer.

---

## 🎨 Tech Stack

| Layer     | Technology |
|-----------|-----------|
| Frontend  | HTML5, CSS3 (custom), Vanilla JS |
| Fonts     | Syne, Instrument Serif, DM Mono (Google Fonts) |
| Backend   | Node.js, Express.js |
| Database  | MongoDB + Mongoose ODM |
| Auth      | JWT (jsonwebtoken) + bcryptjs |
| Upload    | Multer (local disk storage) |
| Validation| express-validator + Mongoose |

---

## ❓ Troubleshooting

**"Cannot connect to server"**
→ Make sure `npm start` is running in the `backend/` folder.

**"MongoDB connection failed"**
→ Check your `MONGO_URI` in `.env`. For local, ensure MongoDB service is running:
```bash
# macOS
brew services start mongodb-community

# Ubuntu/Linux
sudo systemctl start mongod

# Windows
net start MongoDB
```

**Images not loading**
→ The `uploads/` folder is created automatically. Make sure the server has write permissions.

**CORS error in browser**
→ Access the site via `http://localhost:5000` (served by the Node.js server), not by double-clicking the HTML file.
