import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import path from 'path';
import { rateLimit } from 'express-rate-limit';
import { logger, morganStream } from './utils/logger';
import { errorHandler, notFoundHandler } from './middlewares/error';

// ── Route Imports ──────────────────────────────────────────
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import departmentRoutes from './routes/department.routes';
import facultyRoutes from './routes/faculty.routes';
import studentRoutes from './routes/student.routes';
import eventRoutes from './routes/event.routes';
import documentRoutes from './routes/document.routes';
import templateRoutes from './routes/template.routes';
import formRoutes from './routes/form.routes';
import fileRoutes from './routes/file.routes';
import approvalRoutes from './routes/approval.routes';
import inventoryRoutes from './routes/inventory.routes';
import reportRoutes from './routes/report.routes';
import notificationRoutes from './routes/notification.routes';
import activityLogRoutes from './routes/activityLog.routes';
import auditLogRoutes from './routes/auditLog.routes';
import settingRoutes from './routes/setting.routes';
import backupRoutes from './routes/backup.routes';
import dashboardRoutes from './routes/dashboard.routes';
import circularRoutes from './routes/circular.routes';
import achievementRoutes from './routes/achievement.routes';
import momRoutes from './routes/mom.routes';

const app: Application = express();

// ── Security Middlewares ───────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'blob:'],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
    },
  },
}));

// ── CORS ───────────────────────────────────────────────────
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// ── Rate Limiting ─────────────────────────────────────────
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
  max: parseInt(process.env.RATE_LIMIT_MAX || '100'),
  message: { success: false, message: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Stricter limit for auth
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many login attempts, please try again after 15 minutes.' },
});

// ── Body Parsing ───────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(compression());

// ── Logging ────────────────────────────────────────────────
app.use(morgan('combined', { stream: morganStream }));

// ── Static Files (Uploads) ─────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ── Health Check ───────────────────────────────────────────
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0',
    service: 'CDDAS API',
  });
});

// ── API Routes ─────────────────────────────────────────────
const API = '/api/v1';

app.use(`${API}/auth`, authLimiter, authRoutes);
app.use(`${API}/users`, userRoutes);
app.use(`${API}/departments`, departmentRoutes);
app.use(`${API}/faculty`, facultyRoutes);
app.use(`${API}/students`, studentRoutes);
app.use(`${API}/events`, eventRoutes);
app.use(`${API}/documents`, documentRoutes);
app.use(`${API}/templates`, templateRoutes);
app.use(`${API}/forms`, formRoutes);
app.use(`${API}/files`, fileRoutes);
app.use(`${API}/approvals`, approvalRoutes);
app.use(`${API}/inventory`, inventoryRoutes);
app.use(`${API}/reports`, reportRoutes);
app.use(`${API}/notifications`, notificationRoutes);
app.use(`${API}/activity-logs`, activityLogRoutes);
app.use(`${API}/audit-logs`, auditLogRoutes);
app.use(`${API}/settings`, settingRoutes);
app.use(`${API}/backup`, backupRoutes);
app.use(`${API}/dashboard`, dashboardRoutes);
app.use(`${API}/circulars`, circularRoutes);
app.use(`${API}/achievements`, achievementRoutes);
app.use(`${API}/mom`, momRoutes);

// ── Error Handlers ────────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
