# MobifyAI

MobifyAI is an enterprise-level AI-powered mobile app builder that enables users to create fully functional mobile applications through natural language prompts.

## Features

- Natural language app generation
- Multiple AI model support (OpenAI, Anthropic, Google, local models)
- Multi-platform (React Native, Flutter, iOS, Android)
- Real-time app preview
- Source code generation
- Deployment pipeline integration

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- PostgreSQL
- Redis
- API keys for AI providers (OpenAI, Anthropic, etc.)

### Installation

1. Clone this repository
2. Copy `.env.example` to `.env` and fill in your configuration
3. Install dependencies:
   ```
   npm run install:all
   ```
4. Start the development servers:
   ```
   npm start
   ```

## Project Structure

- `client`: Frontend web application
- `server`: Backend API server
- `llm-service`: LLM integration service
- `code-generation`: Code generation service
- `preview-service`: App preview service
- `database-service`: Database service
- `ui-components`: UI component library
- `deployment`: Deployment configuration
- `docs`: Documentation
- `scripts`: Build and utility scripts

## License

This project is licensed under the MIT License - see the LICENSE file for details.
