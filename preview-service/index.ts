// preview-service/index.ts

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import bodyParser from 'body-parser';
import { PrismaClient } from '@prisma/client';
import { Logger } from './utils/logger';
import previewRoutes from './routes/preview';
import authMiddleware from './middlewares/auth';
import errorHandler from './middlewares/errorHandler';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize logger
const logger = new Logger('PreviewService');

// Initialize database
const prisma = new PrismaClient();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 4000;

// Apply middlewares
app.use(cors());
app.use(helmet());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(morgan('combined'));

// Public static directory for previews
app.use('/previews', express.static('public/previews'));

// API routes
app.use('/api/preview', authMiddleware, previewRoutes);

// Error handler
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  logger.info(`Preview service running on port ${PORT}`);
});

export { app, prisma };