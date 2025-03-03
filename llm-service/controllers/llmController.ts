// llm-service/controllers/llmController.ts

import { Request, Response } from 'express';
import llmService, { LLMProvider, LLMService } from '../services/llmService';
import { Logger } from '../utils/logger';
import { z } from 'zod';
import { validateRequest } from '../middlewares/validation';

const logger = new Logger('LLMController');

// Validation schemas
const completionRequestSchema = z.object({
  prompt: z.string().optional(),
  system: z.string().optional(),
  messages: z.array(
    z.object({
      role: z.string(),
      content: z.string()
    })
  ).optional(),
  maxTokens: z.number().positive().optional(),
  temperature: z.number().min(0).max(2).optional(),
  stopSequences: z.array(z.string()).optional(),
  topP: z.number().min(0).max(1).optional(),
  presencePenalty: z.number().min(-2).max(2).optional(),
  frequencyPenalty: z.number().min(-2).max(2).optional(),
  contextId: z.string().optional(),
  provider: z.enum([
    LLMProvider.OPENAI,
    LLMProvider.ANTHROPIC,
    LLMProvider.GOOGLE,
    LLMProvider.COHERE,
    LLMProvider.LMSTUDIO,
    LLMProvider.OLLAMA,
    LLMProvider.DIRECT
  ]).optional(),
  capabilities: z.array(z.string()).optional(),
});

export const validateCompletionRequest = validateRequest(completionRequestSchema);

export class LLMController {
  private llmService: LLMService;

  constructor(llmService: LLMService) {
    this.llmService = llmService;
  }

  public generateCompletion = async (req: Request, res: Response) => {
    try {
      const {
        prompt,
        system,
        messages,
        maxTokens,
        temperature,
        stopSequences,
        topP,
        presencePenalty,
        frequencyPenalty,
        contextId,
        provider,
        capabilities,
      } = req.body;

      // Validate input (at least one of prompt or messages is required)
      if (!prompt && (!messages || messages.length === 0)) {
        return res.status(400).json({ error: 'Either prompt or messages is required' });
      }

      // If capabilities are provided, find the best model
      let selectedProvider = provider;
      if (capabilities && capabilities.length > 0) {
        const { provider: bestProvider } = this.llmService.getBestModelForTask(capabilities, provider);
        selectedProvider = bestProvider;
        logger.info(`Selected provider ${selectedProvider} based on capabilities ${capabilities.join(', ')}`);
      }

      const result = await this.llmService.generateCompletion({
        prompt,
        system,
        messages,
        maxTokens,
        temperature,
        stopSequences,
        topP,
        presencePenalty,
        frequencyPenalty,
        contextId,
      }, selectedProvider);

      res.json({
        text: result.text,
        usage: result.usage,
        provider: result.provider,
        model: result.model,
        finishReason: result.finishReason,
      });
    } catch (error: any) {
      logger.error('Error generating completion', error);
      res.status(500).json({ error: error.message });
    }
  };

  public embedText = async (req: Request, res: Response) => {
    try {
      const { text, provider } = req.body;

      if (!text || typeof text !== 'string') {
        return res.status(400).json({ error: 'Text is required and must be a string' });
      }

      const embedding = await this.llmService.embedText(text, provider);
      res.json({ embedding });
    } catch (error: any) {
      logger.error('Error generating embedding', error);
      res.status(500).json({ error: error.message });
    }
  };

  public getAvailableProviders = async (_req: Request, res: Response) => {
    try {
      // This would come from the LLM service in a real implementation
      const availableProviders = Object.values(LLMProvider)
        .filter(provider => {
          // In a real implementation, check if provider is configured
          return true;
        });

      res.json({ providers: availableProviders });
    } catch (error: any) {
      logger.error('Error getting available providers', error);
      res.status(500).json({ error: error.message });
    }
  };

  public getProviderModels = async (req: Request, res: Response) => {
    try {
      const { provider } = req.params;

      // This would come from the LLM service in a real implementation
      const models = [
        { name: 'model1', capabilities: ['code', 'reasoning'] },
        { name: 'model2', capabilities: ['creative', 'instruction'] },
      ];

      res.json({ models });
    } catch (error: any) {
      logger.error('Error getting provider models', error);
      res.status(500).json({ error: error.message });
    }
  };
}

export default new LLMController(llmService);