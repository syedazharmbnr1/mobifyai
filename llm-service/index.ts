import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { rateLimit } from 'express-rate-limit';
import llmRoutes from './routes';
import { Logger } from './utils/logger';

// Load environment variables
dotenv.config();

const logger = new Logger('LLMService');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Apply middlewares
app.use(cors());
app.use(helmet());
app.use(express.json({ limit: '10mb' }));
app.use(morgan('combined'));

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // Limit each IP to 30 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
});

// API routes
app.use('/api/llm', apiLimiter, llmRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Start server
app.listen(PORT, () => {
  logger.info(`LLM Service running on port ${PORT}`);
});

export default app;
