// llm-service/routes/index.ts

import express from 'express';
import llmController, { validateCompletionRequest } from '../controllers/llmController';
import authMiddleware from '../middlewares/auth';
import rateLimitMiddleware from '../middlewares/rateLimit';

const router = express.Router();

/**
 * @swagger
 * /api/llm/completion:
 *   post:
 *     summary: Generate text completion
 *     description: Generate text completion using various LLM providers
 *     tags: [LLM]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               prompt:
 *                 type: string
 *               system:
 *                 type: string
 *               messages:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     role:
 *                       type: string
 *                     content:
 *                       type: string
 *               maxTokens:
 *                 type: number
 *               temperature:
 *                 type: number
 *               stopSequences:
 *                 type: array
 *                 items:
 *                   type: string
 *               provider:
 *                 type: string
 *               capabilities:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Successful completion
 *       400:
 *         description: Invalid request
 *       500:
 *         description: Server error
 */
router.post('/completion', 
  authMiddleware, 
  rateLimitMiddleware({ windowMs: 60000, max: 20 }), 
  validateCompletionRequest,
  llmController.generateCompletion
);

/**
 * @swagger
 * /api/llm/embedding:
 *   post:
 *     summary: Generate text embedding
 *     description: Generate vector embedding for text
 *     tags: [LLM]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               text:
 *                 type: string
 *               provider:
 *                 type: string
 *     responses:
 *       200:
 *         description: Successful embedding
 *       400:
 *         description: Invalid request
 *       500:
 *         description: Server error
 */
router.post('/embedding', 
  authMiddleware, 
  rateLimitMiddleware({ windowMs: 60000, max: 50 }),
  llmController.embedText
);

/**
 * @swagger
 * /api/llm/providers:
 *   get:
 *     summary: Get available LLM providers
 *     description: Get list of configured LLM providers
 *     tags: [LLM]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of providers
 *       500:
 *         description: Server error
 */
router.get('/providers', 
  authMiddleware,
  llmController.getAvailableProviders
);

/**
 * @swagger
 * /api/llm/providers/{provider}/models:
 *   get:
 *     summary: Get models for a provider
 *     description: Get available models for a specific LLM provider
 *     tags: [LLM]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: provider
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of models
 *       500:
 *         description: Server error
 */
router.get('/providers/:provider/models', 
  authMiddleware,
  llmController.getProviderModels
);

export default router;