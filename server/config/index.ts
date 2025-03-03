export default {
    port: process.env.PORT || 3000,
    nodeEnv: process.env.NODE_ENV || 'development',
    jwtSecret: process.env.JWT_SECRET || 'your_jwt_secret',
    jwtExpiration: process.env.JWT_EXPIRATION || '8h',
    llmServiceUrl: process.env.LLM_SERVICE_URL || 'http://localhost:3001',
    llmServiceApiKey: process.env.LLM_SERVICE_API_KEY || 'your_llm_service_api_key',
    previewServiceUrl: process.env.PREVIEW_SERVICE_URL || 'http://localhost:3002',
    previewServiceApiKey: process.env.PREVIEW_SERVICE_API_KEY || 'your_preview_service_api_key',
    projectsDir: process.env.PROJECTS_DIR || './projects',
  };