import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { rateLimit } from 'express-rate-limit';
import morgan from 'morgan';
import winston from 'winston';
import { createClient } from 'redis';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import authRoutes from './api/auth';
import userRoutes from './api/users';
import projectRoutes from './api/projects';
import appBuilderRoutes from './api/appBuilder';
import codeGenRoutes from './api/codeGen';
import previewRoutes from './api/preview';
import deploymentRoutes from './api/deployment';
import errorHandler from './middlewares/errorHandler';
import authMiddleware from './middlewares/auth';
import indexRouter from './routes/index';

// Load environment variables
dotenv.config();

// Initialize logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

// Initialize database
const prisma = new PrismaClient();

// Initialize Redis client
const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
});

// Connect to Redis
(async () => {
  try {
    await redisClient.connect();
    logger.info('Connected to Redis');
  } catch (error) {
    logger.error('Failed to connect to Redis', { error });
  }
})();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Apply middlewares
app.use(cors());
app.use(helmet());
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('combined'));

// Apply rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', apiLimiter);

// API routes
app.use('/api/auth', authRoutes);
// app.use('/api/users', authMiddleware, userRoutes);
// app.use('/api/projects', authMiddleware, projectRoutes);
// app.use('/api/app-builder', authMiddleware, appBuilderRoutes);
// app.use('/api/code-gen', authMiddleware, codeGenRoutes);
// app.use('/api/preview', authMiddleware, previewRoutes);
// app.use('/api/deployment', authMiddleware, deploymentRoutes);
app.use('/', indexRouter);
// app.use('/api/projects', authMiddleware, projectRoutes);
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/app-builder', appBuilderRoutes);
app.use('/api/code-gen', codeGenRoutes);
app.use('/api/preview', previewRoutes);
app.use('/api/deployment', deploymentRoutes);

// Error handler
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});

// Export for testing
export { app, prisma, redisClient };
