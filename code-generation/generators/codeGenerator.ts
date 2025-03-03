// code-generation/generators/codeGenerator.ts

import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import Handlebars from 'handlebars';
import { v4 as uuidv4 } from 'uuid';
import { Logger } from '../../server/utils/logger';
import { AppSpecParser } from '../parsers/appSpecParser';
import { UIDesignParser } from '../parsers/uiDesignParser';
import { DatabaseSchemaParser } from '../parsers/databaseSchemaParser';
import { PlatformAdapter } from './platformAdapter';
import { ReactNativeAdapter } from './platforms/reactNativeAdapter';
import { FlutterAdapter } from './platforms/flutterAdapter';
import { iOSAdapter } from './platforms/iosAdapter';
import { AndroidAdapter } from './platforms/androidAdapter';
import { GitService } from '../utils/gitService';
import { LLMService, LLMProvider } from '../../llm-service/services/llmService';
import axios from 'axios';
import config from '../../server/config';

const execPromise = promisify(exec);

export interface CodeGenerationOptions {
  projectId: string;
  projectDir: string;
  appSpec: any;
  uiDesignSystem: any;
  dbSchema: any;
  appType: string;
}

export interface CodeGenerationResult {
  success: boolean;
  projectDir: string;
  repositoryUrl?: string;
  error?: string;
}

export class CodeGenerator {
  private logger: Logger;
  private appSpecParser: AppSpecParser;
  private uiDesignParser: UIDesignParser;
  private dbSchemaParser: DatabaseSchemaParser;
  private gitService: GitService;
  private llmService: LLMService;

  constructor() {
    this.logger = new Logger('CodeGenerator');
    this.appSpecParser = new AppSpecParser();
    this.uiDesignParser = new UIDesignParser();
    this.dbSchemaParser = new DatabaseSchemaParser();
    this.gitService = new GitService();
    this.llmService = new LLMService();
  }

  /**
   * Generate application code based on specifications
   */
  async generateCode(options: CodeGenerationOptions): Promise<CodeGenerationResult> {
    try {
      const { projectId, projectDir, appSpec, uiDesignSystem, dbSchema, appType } = options;
      
      // Create platform-specific adapter
      const adapter = this.createPlatformAdapter(appType);
      
      // Parse specifications
      const parsedAppSpec = this.appSpecParser.parse(appSpec);
      const parsedUIDesign = this.uiDesignParser.parse(uiDesignSystem);
      const parsedDbSchema = this.dbSchemaParser.parse(dbSchema);
      
      // Create project structure
      await adapter.createProjectStructure(projectDir, parsedAppSpec);
      
      // Generate base files
      await adapter.generateBaseFiles(projectDir, parsedAppSpec);
      
      // Generate UI components
      await this.generateUIComponents(adapter, projectDir, parsedAppSpec, parsedUIDesign);
      
      // Generate screens
      await this.generateScreens(adapter, projectDir, parsedAppSpec, parsedUIDesign);
      
      // Generate navigation
      await adapter.generateNavigation(projectDir, parsedAppSpec);
      
      // Generate data models
      await this.generateDataModels(adapter, projectDir, parsedAppSpec, parsedDbSchema);
      
      // Generate API services
      await this.generateAPIServices(adapter, projectDir, parsedAppSpec);
      
      // Generate authentication
      await adapter.generateAuthentication(projectDir, parsedAppSpec.authentication);
      
      // Generate database integration
      await adapter.generateDatabaseIntegration(projectDir, parsedDbSchema);
      
      // Generate tests
      await adapter.generateTests(projectDir, parsedAppSpec);
      
      // Initialize Git repository
      const repoUrl = await this.initializeRepository(projectId, projectDir, parsedAppSpec.appName);
      
      return {
        success: true,
        projectDir,
        repositoryUrl: repoUrl
      };
    } catch (error) {
      this.logger.error('Error generating code', error);
      return {
        success: false,
        projectDir: options.projectDir,
        error: error.message
      };
    }
  }

  /**
   * Create platform-specific adapter
   */
  private createPlatformAdapter(appType: string): PlatformAdapter {
    switch (appType.toLowerCase()) {
      case 'react-native':
      case 'react_native':
        return new ReactNativeAdapter();
      case 'flutter':
        return new FlutterAdapter();
      case 'ios':
        return new iOSAdapter();
      case 'android':
        return new AndroidAdapter();
      default:
        // Default to React Native
        return new ReactNativeAdapter();
    }
  }

  /**
   * Generate UI components using AI and templates
   */
  private async generateUIComponents(
    adapter: PlatformAdapter,
    projectDir: string,
    appSpec: any,
    uiDesign: any
  ): Promise<void> {
    try {
      const componentsDir = path.join(projectDir, adapter.getComponentsDir());
      
      // Ensure components directory exists
      fs.mkdirSync(componentsDir, { recursive: true });
      
      // Get list of components to generate
      const components = this.extractComponentList(appSpec, uiDesign);
      
      // Generate each component
      for (const component of components) {
        await this.generateComponentWithAI(adapter, componentsDir, component, uiDesign);
      }
    } catch (error) {
      this.logger.error('Error generating UI components', error);
      throw error;
    }
  }

  /**
   * Extract component list from specifications
   */
  private extractComponentList(appSpec: any, uiDesign: any): string[] {
    const components = new Set<string>();
    
    // Add common components
    components.add('Button');
    components.add('Input');
    components.add('Card');
    components.add('List');
    components.add('Loading');
    components.add('Error');
    components.add('Header');
    components.add('TabBar');
    
    // Add components from UI design
    if (uiDesign.components) {
      Object.keys(uiDesign.components).forEach(component => {
        components.add(this.formatComponentName(component));
      });
    }
    
    // Extract components from screens
    if (appSpec.screens) {
      appSpec.screens.forEach(screen => {
        if (screen.components) {
          screen.components.forEach(component => {
            components.add(this.formatComponentName(component.type));
          });
        }
      });
    }
    
    return Array.from(components);
  }

  /**
   * Format component name to Pascal case
   */
  private formatComponentName(name: string): string {
    // Remove spaces, hyphens, and underscores
    const cleanName = name.replace(/[-_\s]+(.)?/g, (_, c) => c ? c.toUpperCase() : '');
    // Ensure first letter is uppercase
    return cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
  }

  /**
   * Generate a component using AI
   */
  private async generateComponentWithAI(
    adapter: PlatformAdapter,
    componentsDir: string,
    componentName: string,
    uiDesign: any
  ): Promise<void> {
    try {
      // First check if there's a template for this component
      const templatePath = path.join(
        __dirname,
        '../templates',
        adapter.getPlatformName(),
        'components',
        `${componentName}.template`
      );
      
      if (fs.existsSync(templatePath)) {
        // Use template if available
        const template = fs.readFileSync(templatePath, 'utf8');
        const compiledTemplate = Handlebars.compile(template);
        const content = compiledTemplate({
          componentName,
          uiDesign
        });
        
        const filePath = path.join(componentsDir, adapter.getComponentFileName(componentName));
        fs.writeFileSync(filePath, content);
      } else {
        // Generate with AI if no template exists
        const prompt = `
Generate a ${adapter.getPlatformName()} ${componentName} component that follows the design system specifications below:

${JSON.stringify(uiDesign, null, 2)}

The component should be professional, well-structured, and follow best practices. Include appropriate imports, types/interfaces, and exports. Implement the component with proper styling based on the design system.

Return ONLY the code for the component without any explanation or markdown formatting.
`;

        // Call LLM service to generate component
        const response = await axios.post(`${config.llmServiceUrl}/api/llm/completion`, {
          prompt,
          system: `You are an expert ${adapter.getPlatformName()} developer specializing in creating high-quality, maintainable UI components. Your task is to generate a ${componentName} component based on the design specifications provided.`,
          maxTokens: 2000,
          temperature: 0.2,
          capabilities: ['code'],
          provider: LLMProvider.OPENAI, // Prefer OpenAI for code generation
        }, {
          headers: {
            'Authorization': `Bearer ${config.llmServiceApiKey}`,
            'Content-Type': 'application/json',
          },
        });
        
        const result = response.data;
        const componentCode = result.text;
        
        // Extract code if enclosed in code blocks
        const codeMatch = componentCode.match(/```(?:jsx?|tsx?|dart|swift|kotlin)?\n([\s\S]*?)\n```/) || 
                          componentCode.match(/```(?:jsx?|tsx?|dart|swift|kotlin)?([\s\S]*?)```/);
        
        const code = codeMatch ? codeMatch[1] : componentCode;
        
        // Write component file
        const filePath = path.join(componentsDir, adapter.getComponentFileName(componentName));
        fs.writeFileSync(filePath, code);
      }
    } catch (error) {
      this.logger.error(`Error generating component: ${componentName}`, error);
      
      // Create a basic component as fallback
      const basicComponent = adapter.generateBasicComponent(componentName, uiDesign);
      const filePath = path.join(componentsDir, adapter.getComponentFileName(componentName));
      fs.writeFileSync(filePath, basicComponent);
    }
  }

  /**
   * Generate screens using AI and templates
   */
  private async generateScreens(
    adapter: PlatformAdapter,
    projectDir: string,
    appSpec: any,
    uiDesign: any
  ): Promise<void> {
    try {
      const screensDir = path.join(projectDir, adapter.getScreensDir());
      
      // Ensure screens directory exists
      fs.mkdirSync(screensDir, { recursive: true });
      
      // Generate each screen
      for (const screen of appSpec.screens) {
        await this.generateScreenWithAI(adapter, screensDir, screen, appSpec, uiDesign);
      }
    } catch (error) {
      this.logger.error('Error generating screens', error);
      throw error;
    }
  }

  /**
   * Generate a screen using AI
   */
  private async generateScreenWithAI(
    adapter: PlatformAdapter,
    screensDir: string,
    screen: any,
    appSpec: any,
    uiDesign: any
  ): Promise<void> {
    try {
      const screenName = this.formatComponentName(screen.name);
      
      // First check if there's a template for this screen
      const templatePath = path.join(
        __dirname,
        '../templates',
        adapter.getPlatformName(),
        'screens',
        `${screenName}.template`
      );
      
      if (fs.existsSync(templatePath)) {
        // Use template if available
        const template = fs.readFileSync(templatePath, 'utf8');
        const compiledTemplate = Handlebars.compile(template);
        const content = compiledTemplate({
          screen,
          appSpec,
          uiDesign
        });
        
        const filePath = path.join(screensDir, adapter.getScreenFileName(screenName));
        fs.writeFileSync(filePath, content);
      } else {
        // Generate with AI if no template exists
        const prompt = `
Generate a ${adapter.getPlatformName()} screen component named "${screenName}" based on the following specifications:

Screen details:
${JSON.stringify(screen, null, 2)}

Design system:
${JSON.stringify(uiDesign, null, 2)}

The screen should:
1. Include all necessary imports
2. Implement the UI components specified in the screen's components list
3. Include any necessary state management
4. Implement basic functionality described in the screen description
5. Apply styling based on the design system
6. Follow best practices for the ${adapter.getPlatformName()} platform

Return ONLY the code for the screen without any explanation or markdown formatting.
`;

        // Call LLM service to generate screen
        const response = await axios.post(`${config.llmServiceUrl}/api/llm/completion`, {
          prompt,
          system: `You are an expert ${adapter.getPlatformName()} developer specializing in creating high-quality, maintainable screens and views. Your task is to generate a "${screenName}" screen based on the specifications provided.`,
          maxTokens: 3000,
          temperature: 0.3,
          capabilities: ['code'],
          provider: LLMProvider.ANTHROPIC, // Prefer Anthropic for larger code generation
        }, {
          headers: {
            'Authorization': `Bearer ${config.llmServiceApiKey}`,
            'Content-Type': 'application/json',
          },
        });
        
        const result = response.data;
        const screenCode = result.text;
        
        // Extract code if enclosed in code blocks
        const codeMatch = screenCode.match(/```(?:jsx?|tsx?|dart|swift|kotlin)?\n([\s\S]*?)\n```/) || 
                          screenCode.match(/```(?:jsx?|tsx?|dart|swift|kotlin)?([\s\S]*?)```/);
        
        const code = codeMatch ? codeMatch[1] : screenCode;
        
        // Write screen file
        const filePath = path.join(screensDir, adapter.getScreenFileName(screenName));
        fs.writeFileSync(filePath, code);
      }
    } catch (error) {
      this.logger.error(`Error generating screen: ${screen.name}`, error);
      
      // Create a basic screen as fallback
      const screenName = this.formatComponentName(screen.name);
      const basicScreen = adapter.generateBasicScreen(screenName, screen, uiDesign);
      const filePath = path.join(screensDir, adapter.getScreenFileName(screenName));
      fs.writeFileSync(filePath, basicScreen);
    }
  }

  /**
   * Generate data models
   */
  private async generateDataModels(
    adapter: PlatformAdapter,
    projectDir: string,
    appSpec: any,
    dbSchema: any
  ): Promise<void> {
    try {
      const modelsDir = path.join(projectDir, adapter.getModelsDir());
      
      // Ensure models directory exists
      fs.mkdirSync(modelsDir, { recursive: true });
      
      // Generate each model
      for (const model of appSpec.dataModels) {
        const modelName = this.formatComponentName(model.name);
        const modelContent = adapter.generateModel(modelName, model);
        
        const filePath = path.join(modelsDir, adapter.getModelFileName(modelName));
        fs.writeFileSync(filePath, modelContent);
      }
      
      // Generate database schema if applicable
      if (adapter.supportsDatabaseSchema() && dbSchema) {
        const schemaContent = adapter.generateDatabaseSchema(dbSchema);
        const schemaPath = path.join(projectDir, adapter.getDatabaseSchemaPath());
        
        // Ensure directory exists
        const schemaDir = path.dirname(schemaPath);
        fs.mkdirSync(schemaDir, { recursive: true });
        
        fs.writeFileSync(schemaPath, schemaContent);
      }
    } catch (error) {
      this.logger.error('Error generating data models', error);
      throw error;
    }
  }

  /**
   * Generate API services
   */
  private async generateAPIServices(
    adapter: PlatformAdapter,
    projectDir: string,
    appSpec: any
  ): Promise<void> {
    try {
      const servicesDir = path.join(projectDir, adapter.getServicesDir());
      
      // Ensure services directory exists
      fs.mkdirSync(servicesDir, { recursive: true });
      
      // Generate API service
      const apiServiceContent = adapter.generateAPIService(appSpec.apiEndpoints);
      const apiServicePath = path.join(servicesDir, adapter.getAPIServiceFileName());
      fs.writeFileSync(apiServicePath, apiServiceContent);
      
      // Generate individual API services by domain
      if (appSpec.apiEndpoints && appSpec.apiEndpoints.length > 0) {
        // Group endpoints by domain/resource
        const endpointsByDomain = this.groupEndpointsByDomain(appSpec.apiEndpoints);
        
        // Generate service for each domain
        for (const [domain, endpoints] of Object.entries(endpointsByDomain)) {
          const domainServiceContent = adapter.generateDomainService(domain, endpoints);
          const domainServicePath = path.join(servicesDir, adapter.getDomainServiceFileName(domain));
          fs.writeFileSync(domainServicePath, domainServiceContent);
        }
      }
    } catch (error) {
      this.logger.error('Error generating API services', error);
      throw error;
    }
  }

  /**
   * Group API endpoints by domain/resource
   */
  private groupEndpointsByDomain(endpoints: any[]): Record<string, any[]> {
    const endpointsByDomain: Record<string, any[]> = {};
    
    endpoints.forEach(endpoint => {
      // Extract domain from path (e.g., /users/1 -> users)
      const pathParts = endpoint.path.split('/').filter(Boolean);
      if (pathParts.length > 0) {
        const domain = pathParts[0];
        
        if (!endpointsByDomain[domain]) {
          endpointsByDomain[domain] = [];
        }
        
        endpointsByDomain[domain].push(endpoint);
      }
    });
    
    return endpointsByDomain;
  }

  /**
   * Initialize Git repository and push to remote
   */
  private async initializeRepository(
    projectId: string,
    projectDir: string,
    appName: string
  ): Promise<string> {
    try {
      // Create repository name
      const repoName = `${appName.toLowerCase().replace(/\s+/g, '-')}-${projectId.slice(0, 8)}`;
      
      // Initialize Git repository
      await this.gitService.init(projectDir);
      
      // Create .gitignore
      const gitignorePath = path.join(projectDir, '.gitignore');
      fs.writeFileSync(gitignorePath, this.getGitignoreContent());
      
      // Create README.md
      const readmePath = path.join(projectDir, 'README.md');
      fs.writeFileSync(readmePath, this.getReadmeContent(appName, projectId));
      
      // Add all files to staging
      await this.gitService.addAll(projectDir);
      
      // Commit changes
      await this.gitService.commit(projectDir, 'Initial commit');
      
      // Create remote repository
      const repoUrl = await this.gitService.createRemoteRepository(repoName, appName);
      
      // Push to remote
      await this.gitService.pushToRemote(projectDir, repoUrl);
      
      return repoUrl;
    } catch (error) {
      this.logger.error('Error initializing Git repository', error);
      return '';
    }
  }

  /**
   * Get content for .gitignore file
   */
  private getGitignoreContent(): string {
    return `
# Dependencies
/node_modules
/.pnp
.pnp.js
/ios/Pods
/vendor

# Testing
/coverage

# Production
/build
/dist
/android/app/build
/ios/build

# Misc
.DS_Store
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Android/IntelliJ
.idea
.gradle
local.properties
*.iml
*.hprof

# iOS
*.pbxuser
!default.pbxuser
*.mode1v3
!default.mode1v3
*.mode2v3
!default.mode2v3
*.perspectivev3
!default.perspectivev3
xcuserdata
*.xccheckout
*.moved-aside
DerivedData
*.hmap
*.ipa
*.xcuserstate
project.xcworkspace

# BUCK
buck-out/
\\.buckd/
*.keystore
!debug.keystore

# fastlane
*/fastlane/report.xml
*/fastlane/Preview.html
*/fastlane/screenshots

# Bundle artifact
*.jsbundle

# CocoaPods
/ios/Pods/
`;
  }

  /**
   * Get content for README.md file
   */
  private getReadmeContent(appName: string, projectId: string): string {
    return `
# ${appName}

This mobile app was generated using MobifyAI, an AI-powered mobile app builder.

## Project ID

\`${projectId}\`

## Features

- List of app features will go here

## Getting Started

### Prerequisites

- Node.js (14.x or higher)
- npm or yarn
- React Native CLI (for React Native projects)
- Xcode (for iOS development)
- Android Studio (for Android development)
- Flutter SDK (for Flutter projects)

### Installation

1. Clone this repository
2. Install dependencies:
   \`\`\`
   npm install
   # or
   yarn install
   \`\`\`
3. Install iOS dependencies (for iOS development):
   \`\`\`
   cd ios && pod install
   \`\`\`

### Running the App

#### iOS

\`\`\`
npm run ios
# or
yarn ios
\`\`\`

#### Android

\`\`\`
npm run android
# or
yarn android
\`\`\`

## Project Structure

- Overview of project structure will go here

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Generated with MobifyAI

This app was generated with [MobifyAI](https://mobifyai.example.com), an AI-powered mobile app builder.

`;
  }
}