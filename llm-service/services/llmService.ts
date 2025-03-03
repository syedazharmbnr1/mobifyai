// llm-service/services/llmService.ts

import axios from 'axios';
import { OpenAI } from 'openai';
import { Anthropic } from '@anthropic-ai/sdk';
import path from 'path';
import fs from 'fs';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { CohereClient } from 'cohere-ai';
import { spawn } from 'child_process';
import { v4 as uuidv4 } from 'uuid';
import { createClient } from 'redis';
import { Logger } from '../utils/logger';

interface LLMProviderConfig {
  apiKey?: string;
  baseUrl?: string;
  organizationId?: string;
  modelName: string;
  maxTokens?: number;
  temperature?: number;
  additionalParams?: Record<string, any>;
}

interface LLMRequest {
  prompt: string;
  system?: string;
  messages?: Array<{ role: string; content: string }>;
  maxTokens?: number;
  temperature?: number;
  stopSequences?: string[];
  topP?: number;
  presencePenalty?: number;
  frequencyPenalty?: number;
  contextId?: string;
}

interface LLMResponse {
  text: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  provider: string;
  model: string;
  finishReason?: string;
}

export enum LLMProvider {
  OPENAI = 'openai',
  ANTHROPIC = 'anthropic',
  GOOGLE = 'google',
  COHERE = 'cohere',
  LMSTUDIO = 'lmstudio',
  OLLAMA = 'ollama',
  DIRECT = 'direct',
}

export class LLMService {
  private openai: OpenAI | null = null;
  private anthropic: Anthropic | null = null;
  private googleAI: GoogleGenerativeAI | null = null;
  private cohere: CohereClient | null = null;
  private redisClient: any;
  private logger: Logger;
  private localModelProcesses: Map<string, any> = new Map();
  private providerConfigs: Map<LLMProvider, LLMProviderConfig> = new Map();
  private defaultProvider: LLMProvider = LLMProvider.OPENAI;
  private modelCapabilities: Map<string, Set<string>> = new Map();

  constructor() {
    this.logger = new Logger('LLMService');
    this.redisClient = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
    });
    this.redisClient.connect().catch((err: any) => {
      this.logger.error('Redis connection error', err);
    });
    
    this.initProviders();
    this.initModelCapabilities();
  }

  private initProviders() {
    // Initialize OpenAI if API key is available
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
        organization: process.env.OPENAI_ORGANIZATION_ID,
      });
      
      this.providerConfigs.set(LLMProvider.OPENAI, {
        apiKey: process.env.OPENAI_API_KEY,
        organizationId: process.env.OPENAI_ORGANIZATION_ID,
        modelName: process.env.OPENAI_DEFAULT_MODEL || 'gpt-4o',
        maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS || '4096'),
        temperature: parseFloat(process.env.OPENAI_TEMPERATURE || '0.7'),
      });
    }

    // Initialize Anthropic if API key is available
    if (process.env.ANTHROPIC_API_KEY) {
      this.anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      });
      
      this.providerConfigs.set(LLMProvider.ANTHROPIC, {
        apiKey: process.env.ANTHROPIC_API_KEY,
        modelName: process.env.ANTHROPIC_DEFAULT_MODEL || 'claude-3-opus-20240229',
        maxTokens: parseInt(process.env.ANTHROPIC_MAX_TOKENS || '4096'),
        temperature: parseFloat(process.env.ANTHROPIC_TEMPERATURE || '0.7'),
      });
    }

    // Initialize Google Gemini if API key is available
    if (process.env.GOOGLE_AI_API_KEY) {
      this.googleAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
      
      this.providerConfigs.set(LLMProvider.GOOGLE, {
        apiKey: process.env.GOOGLE_AI_API_KEY,
        modelName: process.env.GOOGLE_DEFAULT_MODEL || 'gemini-pro',
        maxTokens: parseInt(process.env.GOOGLE_MAX_TOKENS || '4096'),
        temperature: parseFloat(process.env.GOOGLE_TEMPERATURE || '0.7'),
      });
    }

    // Initialize Cohere if API key is available
    if (process.env.COHERE_API_KEY) {
      this.cohere = new CohereClient({
        token: process.env.COHERE_API_KEY,
      });
      
      this.providerConfigs.set(LLMProvider.COHERE, {
        apiKey: process.env.COHERE_API_KEY,
        modelName: process.env.COHERE_DEFAULT_MODEL || 'command',
        maxTokens: parseInt(process.env.COHERE_MAX_TOKENS || '4096'),
        temperature: parseFloat(process.env.COHERE_TEMPERATURE || '0.7'),
      });
    }

    // Initialize LM Studio configuration if available
    if (process.env.LMSTUDIO_HOST) {
      this.providerConfigs.set(LLMProvider.LMSTUDIO, {
        baseUrl: process.env.LMSTUDIO_HOST || 'http://localhost:1234/v1',
        modelName: process.env.LMSTUDIO_DEFAULT_MODEL || 'local-model',
        maxTokens: parseInt(process.env.LMSTUDIO_MAX_TOKENS || '4096'),
        temperature: parseFloat(process.env.LMSTUDIO_TEMPERATURE || '0.7'),
      });
    }

    // Initialize Ollama configuration if available
    if (process.env.OLLAMA_HOST) {
      this.providerConfigs.set(LLMProvider.OLLAMA, {
        baseUrl: process.env.OLLAMA_HOST || 'http://localhost:11434/api',
        modelName: process.env.OLLAMA_DEFAULT_MODEL || 'llama3',
        maxTokens: parseInt(process.env.OLLAMA_MAX_TOKENS || '4096'),
        temperature: parseFloat(process.env.OLLAMA_TEMPERATURE || '0.7'),
      });
    }

    // Initialize direct model loading if models directory is specified
    if (process.env.LOCAL_MODELS_DIR) {
      this.providerConfigs.set(LLMProvider.DIRECT, {
        baseUrl: process.env.LOCAL_MODELS_DIR,
        modelName: process.env.LOCAL_DEFAULT_MODEL || 'llama-3-8b-q4',
        maxTokens: parseInt(process.env.LOCAL_MAX_TOKENS || '4096'),
        temperature: parseFloat(process.env.LOCAL_TEMPERATURE || '0.7'),
      });
    }

    // Set default provider based on environment or available providers
    if (process.env.DEFAULT_LLM_PROVIDER) {
      const providerName = process.env.DEFAULT_LLM_PROVIDER.toLowerCase();
      for (const provider of Object.values(LLMProvider)) {
        if (provider.toLowerCase() === providerName && this.providerConfigs.has(provider as LLMProvider)) {
          this.defaultProvider = provider as LLMProvider;
          break;
        }
      }
    } else {
      // Set first available provider as default
      for (const provider of this.providerConfigs.keys()) {
        this.defaultProvider = provider;
        break;
      }
    }

    this.logger.info(`Initialized LLM service with default provider: ${this.defaultProvider}`);
  }

  private initModelCapabilities() {
    // Define capabilities for different models
    // This helps in routing requests to the right model based on task requirements
    
    // OpenAI models
    this.setModelCapabilities('gpt-4o', ['code', 'reasoning', 'creative', 'instruction', 'vision']);
    this.setModelCapabilities('gpt-4-turbo', ['code', 'reasoning', 'creative', 'instruction']);
    this.setModelCapabilities('gpt-3.5-turbo', ['code', 'instruction', 'creative']);
    
    // Anthropic models
    this.setModelCapabilities('claude-3-opus-20240229', ['code', 'reasoning', 'creative', 'instruction', 'vision']);
    this.setModelCapabilities('claude-3-sonnet-20240229', ['code', 'reasoning', 'creative', 'instruction', 'vision']);
    this.setModelCapabilities('claude-3-haiku-20240307', ['code', 'creative', 'instruction', 'vision']);
    
    // Google models
    this.setModelCapabilities('gemini-pro', ['code', 'reasoning', 'creative', 'instruction']);
    this.setModelCapabilities('gemini-pro-vision', ['code', 'reasoning', 'creative', 'instruction', 'vision']);
    
    // Local models
    this.setModelCapabilities('llama-3', ['code', 'reasoning', 'creative', 'instruction']);
    this.setModelCapabilities('mistral-7b', ['code', 'instruction']);
  }

  private setModelCapabilities(model: string, capabilities: string[]) {
    this.modelCapabilities.set(model, new Set(capabilities));
  }

  public hasCapability(model: string, capability: string): boolean {
    const capabilities = this.modelCapabilities.get(model);
    return capabilities ? capabilities.has(capability) : false;
  }

  public getBestModelForTask(capabilities: string[], preferredProvider?: LLMProvider): { provider: LLMProvider, model: string } {
    let bestProvider = preferredProvider || this.defaultProvider;
    let bestModel = '';
    let maxMatchedCapabilities = -1;

    // First try with preferred provider
    const preferredConfig = this.providerConfigs.get(bestProvider);
    if (preferredConfig) {
      const model = preferredConfig.modelName;
      const modelCapabilities = this.modelCapabilities.get(model);
      if (modelCapabilities) {
        const matchedCapabilities = capabilities.filter(cap => modelCapabilities.has(cap)).length;
        if (matchedCapabilities === capabilities.length) {
          return { provider: bestProvider, model };
        }
        maxMatchedCapabilities = matchedCapabilities;
        bestModel = model;
      }
    }

    // If preferred provider doesn't have all capabilities, check others
    for (const [provider, config] of this.providerConfigs.entries()) {
      if (provider === bestProvider) continue;
      
      const model = config.modelName;
      const modelCapabilities = this.modelCapabilities.get(model);
      if (modelCapabilities) {
        const matchedCapabilities = capabilities.filter(cap => modelCapabilities.has(cap)).length;
        if (matchedCapabilities > maxMatchedCapabilities) {
          maxMatchedCapabilities = matchedCapabilities;
          bestProvider = provider;
          bestModel = model;
          
          if (matchedCapabilities === capabilities.length) {
            break; // Found perfect match
          }
        }
      }
    }

    return { 
      provider: bestProvider, 
      model: bestModel || this.providerConfigs.get(bestProvider)?.modelName || 'unknown' 
    };
  }

  public async generateCompletion(request: LLMRequest, provider?: LLMProvider): Promise<LLMResponse> {
    const selectedProvider = provider || this.defaultProvider;
    const config = this.providerConfigs.get(selectedProvider);
    
    if (!config) {
      throw new Error(`Provider ${selectedProvider} not configured`);
    }

    try {
      switch (selectedProvider) {
        case LLMProvider.OPENAI:
          return await this.generateWithOpenAI(request, config);
        case LLMProvider.ANTHROPIC:
          return await this.generateWithAnthropic(request, config);
        case LLMProvider.GOOGLE:
          return await this.generateWithGoogle(request, config);
        case LLMProvider.COHERE:
          return await this.generateWithCohere(request, config);
        case LLMProvider.LMSTUDIO:
          return await this.generateWithLMStudio(request, config);
        case LLMProvider.OLLAMA:
          return await this.generateWithOllama(request, config);
        case LLMProvider.DIRECT:
          return await this.generateWithDirectModel(request, config);
        default:
          throw new Error(`Unsupported provider: ${selectedProvider}`);
      }
    } catch (error: any) {
      this.logger.error(`Error generating completion with ${selectedProvider}`, error);
      
      // If fallback is enabled and this isn't already a fallback call
      if (process.env.ENABLE_LLM_FALLBACK === 'true' && provider === undefined) {
        const fallbackProviders = this.getFallbackProviders(selectedProvider);
        for (const fallbackProvider of fallbackProviders) {
          try {
            this.logger.info(`Attempting fallback to ${fallbackProvider}`);
            return await this.generateCompletion(request, fallbackProvider);
          } catch (fallbackError) {
            this.logger.error(`Fallback to ${fallbackProvider} failed`, fallbackError);
            // Continue to next fallback
          }
        }
      }
      
      // If we get here, all fallbacks failed or fallback is disabled
      throw error;
    }
  }

  private getFallbackProviders(currentProvider: LLMProvider): LLMProvider[] {
    const fallbacks: LLMProvider[] = [];
    
    // Add cloud providers first as they're more reliable
    if (currentProvider !== LLMProvider.OPENAI && this.providerConfigs.has(LLMProvider.OPENAI)) {
      fallbacks.push(LLMProvider.OPENAI);
    }
    
    if (currentProvider !== LLMProvider.ANTHROPIC && this.providerConfigs.has(LLMProvider.ANTHROPIC)) {
      fallbacks.push(LLMProvider.ANTHROPIC);
    }
    
    if (currentProvider !== LLMProvider.GOOGLE && this.providerConfigs.has(LLMProvider.GOOGLE)) {
      fallbacks.push(LLMProvider.GOOGLE);
    }
    
    if (currentProvider !== LLMProvider.COHERE && this.providerConfigs.has(LLMProvider.COHERE)) {
      fallbacks.push(LLMProvider.COHERE);
    }
    
    // Then add local providers
    if (currentProvider !== LLMProvider.LMSTUDIO && this.providerConfigs.has(LLMProvider.LMSTUDIO)) {
      fallbacks.push(LLMProvider.LMSTUDIO);
    }
    
    if (currentProvider !== LLMProvider.OLLAMA && this.providerConfigs.has(LLMProvider.OLLAMA)) {
      fallbacks.push(LLMProvider.OLLAMA);
    }
    
    if (currentProvider !== LLMProvider.DIRECT && this.providerConfigs.has(LLMProvider.DIRECT)) {
      fallbacks.push(LLMProvider.DIRECT);
    }
    
    return fallbacks;
  }

  private async generateWithOpenAI(request: LLMRequest, config: LLMProviderConfig): Promise<LLMResponse> {
    if (!this.openai) {
      throw new Error('OpenAI client not initialized');
    }

    const messages = request.messages || [];
    
    // Add system message if provided
    if (request.system && !messages.some(m => m.role === 'system')) {
      messages.unshift({ role: 'system', content: request.system });
    }
    
    // Add user message if only prompt is provided
    if (request.prompt && messages.length === 0) {
      messages.push({ role: 'user', content: request.prompt });
    }

    const response = await this.openai.chat.completions.create({
      model: config.modelName,
      messages: messages.map(m => ({ 
        role: m.role as 'system' | 'user' | 'assistant',
        content: m.content 
      })),
      temperature: request.temperature || config.temperature || 0.7,
      max_tokens: request.maxTokens || config.maxTokens,
      top_p: request.topP || 1,
      presence_penalty: request.presencePenalty || 0,
      frequency_penalty: request.frequencyPenalty || 0,
      stop: request.stopSequences,
      ...(config.additionalParams || {})
    });

    return {
      text: response.choices[0]?.message?.content || '',
      usage: {
        promptTokens: response.usage?.prompt_tokens || 0,
        completionTokens: response.usage?.completion_tokens || 0,
        totalTokens: response.usage?.total_tokens || 0,
      },
      provider: LLMProvider.OPENAI,
      model: config.modelName,
      finishReason: response.choices[0]?.finish_reason,
    };
  }

  private async generateWithAnthropic(request: LLMRequest, config: LLMProviderConfig): Promise<LLMResponse> {
    if (!this.anthropic) {
      throw new Error('Anthropic client not initialized');
    }

    const messages = request.messages || [];
    let systemPrompt = request.system || '';
    
    // Build message array for Anthropic
    const anthropicMessages = messages.map(m => ({
      role: m.role === 'user' ? 'user' : 'assistant',
      content: m.content
    }));
    
    // Add user message if only prompt is provided
    if (request.prompt && anthropicMessages.length === 0) {
      anthropicMessages.push({ role: 'user', content: request.prompt });
    }

    const response = await this.anthropic.messages.create({
      model: config.modelName,
      messages: anthropicMessages,
      system: systemPrompt || undefined,
      temperature: request.temperature || config.temperature || 0.7,
      max_tokens: request.maxTokens || config.maxTokens,
      top_p: request.topP || 1,
      stop_sequences: request.stopSequences,
      ...(config.additionalParams || {})
    });

    return {
      text: response.content[0]?.text || '',
      usage: {
        promptTokens: response.usage?.input_tokens || 0,
        completionTokens: response.usage?.output_tokens || 0,
        totalTokens: (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0),
      },
      provider: LLMProvider.ANTHROPIC,
      model: config.modelName,
      finishReason: response.stop_reason,
    };
  }

  private async generateWithGoogle(request: LLMRequest, config: LLMProviderConfig): Promise<LLMResponse> {
    if (!this.googleAI) {
      throw new Error('Google AI client not initialized');
    }

    const model = this.googleAI.getGenerativeModel({ model: config.modelName });
    const messages = request.messages || [];
    
    // Convert messages to Google's format
    const googleMessages = messages.map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }]
    }));
    
    // Add system message if provided
    if (request.system && googleMessages.length > 0) {
      // Google doesn't have system messages, prepend to first user message
      const firstUserIndex = googleMessages.findIndex(m => m.role === 'user');
      if (firstUserIndex >= 0) {
        googleMessages[firstUserIndex].parts[0].text = 
          `${request.system}\n\n${googleMessages[firstUserIndex].parts[0].text}`;
      }
    }
    
    // Add user message if only prompt is provided
    if (request.prompt && googleMessages.length === 0) {
      googleMessages.push({ 
        role: 'user', 
        parts: [{ text: request.system ? `${request.system}\n\n${request.prompt}` : request.prompt }] 
      });
    }

    const generationConfig = {
      temperature: request.temperature || config.temperature || 0.7,
      maxOutputTokens: request.maxTokens || config.maxTokens,
      topP: request.topP || 1,
      stopSequences: request.stopSequences || [],
    };

    const response = await model.generateContent({
      contents: googleMessages,
      generationConfig,
    });

    const result = response.response;
    const text = result.text();

    return {
      text,
      usage: {
        promptTokens: 0, // Google doesn't provide token usage
        completionTokens: 0,
        totalTokens: 0,
      },
      provider: LLMProvider.GOOGLE,
      model: config.modelName,
      finishReason: 'stop', // Google doesn't provide finish reason
    };
  }

  private async generateWithCohere(request: LLMRequest, config: LLMProviderConfig): Promise<LLMResponse> {
    if (!this.cohere) {
      throw new Error('Cohere client not initialized');
    }

    const messages = request.messages || [];
    let prompt = request.prompt || '';
    
    // Convert messages to chat history format for Cohere
    const chatHistory = [];
    for (let i = 0; i < messages.length - 1; i += 2) {
      if (i + 1 < messages.length) {
        chatHistory.push({
          message: messages[i].content,
          role: 'USER',
        });
        chatHistory.push({
          message: messages[i + 1].content,
          role: 'CHATBOT',
        });
      }
    }
    
    // Add the last message if odd number of messages
    if (messages.length % 2 !== 0 && messages.length > 0) {
      chatHistory.push({
        message: messages[messages.length - 1].content,
        role: 'USER',
      });
    }
    
    // If only prompt provided, use that
    if (prompt && chatHistory.length === 0) {
      chatHistory.push({
        message: prompt,
        role: 'USER',
      });
    }

    // Use system prompt in preamble if provided
    const preamble = request.system || undefined;

    const response = await this.cohere.chatStream({
      model: config.modelName,
      message: prompt || messages[messages.length - 1]?.content || '',
      temperature: request.temperature || config.temperature || 0.7,
      max_tokens: request.maxTokens || config.maxTokens,
      p: request.topP || 1,
      chat_history: chatHistory.length > 0 ? chatHistory : undefined,
      preamble,
      stop_sequences: request.stopSequences,
      ...(config.additionalParams || {})
    });

    // Collect the response pieces
    let fullText = '';
    for await (const chunk of response) {
      if (chunk.eventType === 'text-generation') {
        fullText += chunk.text;
      }
    }

    return {
      text: fullText,
      usage: {
        promptTokens: 0, // Cohere doesn't provide token usage in stream
        completionTokens: 0,
        totalTokens: 0,
      },
      provider: LLMProvider.COHERE,
      model: config.modelName,
      finishReason: 'stop', // Cohere doesn't provide finish reason in stream
    };
  }

  private async generateWithLMStudio(request: LLMRequest, config: LLMProviderConfig): Promise<LLMResponse> {
    if (!config.baseUrl) {
      throw new Error('LM Studio base URL not configured');
    }

    const messages = request.messages || [];
    
    // Format messages for LM Studio (OpenAI-compatible API)
    const formattedMessages = [];
    
    // Add system message if provided
    if (request.system) {
      formattedMessages.push({ role: 'system', content: request.system });
    }
    
    // Add all messages
    formattedMessages.push(...messages);
    
    // Add user message if only prompt is provided
    if (request.prompt && formattedMessages.length === 0) {
      formattedMessages.push({ role: 'user', content: request.prompt });
    }

    const response = await axios.post(`${config.baseUrl}/chat/completions`, {
      model: config.modelName,
      messages: formattedMessages,
      temperature: request.temperature || config.temperature || 0.7,
      max_tokens: request.maxTokens || config.maxTokens,
      top_p: request.topP || 1,
      stop: request.stopSequences,
      ...(config.additionalParams || {})
    });

    return {
      text: response.data.choices[0]?.message?.content || '',
      usage: {
        promptTokens: response.data.usage?.prompt_tokens || 0,
        completionTokens: response.data.usage?.completion_tokens || 0,
        totalTokens: response.data.usage?.total_tokens || 0,
      },
      provider: LLMProvider.LMSTUDIO,
      model: config.modelName,
      finishReason: response.data.choices[0]?.finish_reason,
    };
  }

  private async generateWithOllama(request: LLMRequest, config: LLMProviderConfig): Promise<LLMResponse> {
    if (!config.baseUrl) {
      throw new Error('Ollama base URL not configured');
    }

    const messages = request.messages || [];
    let systemPrompt = request.system || '';
    
    // Format messages for Ollama
    const formattedMessages = [];
    
    // Add system message if provided
    if (systemPrompt) {
      formattedMessages.push({ role: 'system', content: systemPrompt });
    }
    
    // Add all messages
    formattedMessages.push(...messages);
    
    // Add user message if only prompt is provided
    if (request.prompt && formattedMessages.length === 0) {
      formattedMessages.push({ role: 'user', content: request.prompt });
    }

    const response = await axios.post(`${config.baseUrl}/chat`, {
      model: config.modelName,
      messages: formattedMessages,
      options: {
        temperature: request.temperature || config.temperature || 0.7,
        num_predict: request.maxTokens || config.maxTokens,
        top_p: request.topP || 1,
        stop: request.stopSequences,
        ...(config.additionalParams || {})
      },
      stream: false
    });

    return {
      text: response.data.message?.content || '',
      usage: {
        promptTokens: response.data.prompt_eval_count || 0,
        completionTokens: response.data.eval_count || 0,
        totalTokens: (response.data.prompt_eval_count || 0) + (response.data.eval_count || 0),
      },
      provider: LLMProvider.OLLAMA,
      model: config.modelName,
      finishReason: 'stop',
    };
  }

  private async generateWithDirectModel(request: LLMRequest, config: LLMProviderConfig): Promise<LLMResponse> {
    if (!config.baseUrl) {
      throw new Error('Local models directory not configured');
    }

    // For direct model execution, we need to spawn a process that loads the model
    // This is a simplified example - in practice, you'd want a more sophisticated process manager
    
    const modelPath = path.join(config.baseUrl, config.modelName);
    if (!fs.existsSync(modelPath)) {
      throw new Error(`Model not found at ${modelPath}`);
    }

    const requestId = uuidv4();
    const promptPath = path.join(os.tmpdir(), `prompt-${requestId}.txt`);
    const outputPath = path.join(os.tmpdir(), `output-${requestId}.txt`);
    
    // Create prompt file
    const promptContent = request.system ? 
      `${request.system}\n\n${request.prompt || ''}` : 
      request.prompt || '';
    
    fs.writeFileSync(promptPath, promptContent);
    
    return new Promise((resolve, reject) => {
      // This is a simplified example - you'd use a proper model runner in practice
      const process = spawn('python', [
        path.join(__dirname, '../scripts/run_local_model.py'),
        '--model', modelPath,
        '--prompt', promptPath,
        '--output', outputPath,
        '--temperature', String(request.temperature || config.temperature || 0.7),
        '--max_tokens', String(request.maxTokens || config.maxTokens || 4096)
      ]);
      
      this.localModelProcesses.set(requestId, process);
      
      process.on('close', (code) => {
        this.localModelProcesses.delete(requestId);
        
        if (code !== 0) {
          fs.unlinkSync(promptPath);
          if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
          return reject(new Error(`Process exited with code ${code}`));
        }
        
        if (!fs.existsSync(outputPath)) {
          fs.unlinkSync(promptPath);
          return reject(new Error('Output file not found'));
        }
        
        const output = fs.readFileSync(outputPath, 'utf8');
        fs.unlinkSync(promptPath);
        fs.unlinkSync(outputPath);
        
        resolve({
          text: output,
          usage: {
            promptTokens: 0,
            completionTokens: 0,
            totalTokens: 0,
          },
          provider: LLMProvider.DIRECT,
          model: config.modelName,
          finishReason: 'stop',
        });
      });
      
      process.on('error', (err) => {
        this.localModelProcesses.delete(requestId);
        fs.unlinkSync(promptPath);
        if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
        reject(err);
      });
    });
  }

  public async embedText(text: string, provider?: LLMProvider): Promise<number[]> {
    // Implementation of text embedding using various providers
    // This would use OpenAI, Google, or local embedding models
    // For brevity, only showing OpenAI implementation
    
    const selectedProvider = provider || this.defaultProvider;
    
    switch (selectedProvider) {
      case LLMProvider.OPENAI:
        if (!this.openai) {
          throw new Error('OpenAI client not initialized');
        }
        
        const response = await this.openai.embeddings.create({
          model: 'text-embedding-3-small',
          input: text,
        });
        
        return response.data[0].embedding;
        
      // Add other embedding providers as needed
      
      default:
        throw new Error(`Embedding not implemented for provider: ${selectedProvider}`);
    }
  }

  public shutdown() {
    // Clean up any resources
    for (const process of this.localModelProcesses.values()) {
      process.kill();
    }
    
    this.redisClient.disconnect();
  }
}

export default new LLMService();