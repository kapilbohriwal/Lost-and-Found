require('dotenv').config();
const express  = require('express');
const cors     = require('cors');
const path     = require('path');
const connectDB = require('./db');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Connect MongoDB
connectDB();

// ── Middleware ─────────────────────────────────────────────
app.use(cors({
  origin: [
    'http://localhost:5000',
    'http://127.0.0.1:5000',
    'http://localhost:5500',
    'http://127.0.0.1:5500',
    'http://localhost:3000',
  ],
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Static Files ───────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use(express.static(path.join(__dirname, '../frontend')));

// ── API Routes ─────────────────────────────────────────────
app.use('/api/auth',     require('./routes/auth'));
app.use('/api/items',    require('./routes/items'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/admin',    require('./routes/admin'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, status: 'running', timestamp: new Date().toISOString() });
});

// Serve frontend for non-API routes

app.get('/', (req, res) => {
  res.send('API is running 🚀');
});

// app.get('*', (req, res) => {
//   if (!req.path.startsWith('/api') && !req.path.startsWith('/uploads')) {
//     res.sendFile(path.join(__dirname, '../frontend/index.html'));
//   }
// });

// ── Error Handler ──────────────────────────────────────────
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚀  Server running → http://localhost:${PORT}`);
  console.log(`📁  Frontend      → http://localhost:${PORT}`);
  console.log(`🔗  API           → http://localhost:${PORT}/api`);
  console.log(`💊  Health        → http://localhost:${PORT}/api/health\n`);
});
