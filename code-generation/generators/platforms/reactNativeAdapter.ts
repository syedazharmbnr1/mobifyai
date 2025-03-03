// code-generation/generators/platforms/reactNativeAdapter.ts

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { PlatformAdapter } from '../platformAdapter';
import { Logger } from '../../../server/utils/logger';
import Handlebars from 'handlebars';

export class ReactNativeAdapter implements PlatformAdapter {
  private logger: Logger;

  constructor() {
    this.logger = new Logger('ReactNativeAdapter');
  }

  /**
   * Get platform name
   */
  getPlatformName(): string {
    return 'React Native';
  }

  /**
   * Get components directory
   */
  getComponentsDir(): string {
    return 'src/components';
  }

  /**
   * Get screens directory
   */
  getScreensDir(): string {
    return 'src/screens';
  }

  /**
   * Get models directory
   */
  getModelsDir(): string {
    return 'src/models';
  }

  /**
   * Get services directory
   */
  getServicesDir(): string {
    return 'src/services';
  }

  /**
   * Get navigation directory
   */
  getNavigationDir(): string {
    return 'src/navigation';
  }

  /**
   * Get theme directory
   */
  getThemeDir(): string {
    return 'src/theme';
  }

  /**
   * Get utilities directory
   */
  getUtilsDir(): string {
    return 'src/utils';
  }

  /**
   * Get assets directory
   */
  getAssetsDir(): string {
    return 'src/assets';
  }

  /**
   * Get contexts directory
   */
  getContextsDir(): string {
    return 'src/contexts';
  }

  /**
   * Get hooks directory
   */
  getHooksDir(): string {
    return 'src/hooks';
  }

  /**
   * Get whether the platform supports database schema
   */
  supportsDatabaseSchema(): boolean {
    return true;
  }

  /**
   * Get database schema path
   */
  getDatabaseSchemaPath(): string {
    return 'src/services/db/schema.js';
  }

  /**
   * Get component file name
   */
  getComponentFileName(componentName: string): string {
    return `${componentName}.tsx`;
  }

  /**
   * Get screen file name
   */
  getScreenFileName(screenName: string): string {
    return `${screenName}Screen.tsx`;
  }

  /**
   * Get model file name
   */
  getModelFileName(modelName: string): string {
    return `${modelName}.ts`;
  }

  /**
   * Get API service file name
   */
  getAPIServiceFileName(): string {
    return 'api.ts';
  }

  /**
   * Get domain service file name
   */
  getDomainServiceFileName(domain: string): string {
    return `${domain}Service.ts`;
  }

  /**
   * Create project structure
   */
  async createProjectStructure(projectDir: string, appSpec: any): Promise<void> {
    try {
      // Create base project using React Native CLI
      this.initializeReactNativeProject(projectDir, appSpec);
      
      // Create directory structure
      const directories = [
        this.getComponentsDir(),
        this.getScreensDir(),
        this.getModelsDir(),
        this.getServicesDir(),
        this.getNavigationDir(),
        this.getThemeDir(),
        this.getUtilsDir(),
        this.getAssetsDir(),
        this.getContextsDir(),
        this.getHooksDir(),
        'src/services/db',
        'src/assets/images',
        'src/assets/fonts',
        'src/assets/icons',
        '__tests__/components',
        '__tests__/screens',
        '__tests__/services',
      ];
      
      directories.forEach(dir => {
        const dirPath = path.join(projectDir, dir);
        fs.mkdirSync(dirPath, { recursive: true });
      });
      
      // Create .gitkeep files in empty directories
      directories.forEach(dir => {
        const dirPath = path.join(projectDir, dir);
        const files = fs.readdirSync(dirPath);
        
        if (files.length === 0) {
          fs.writeFileSync(path.join(dirPath, '.gitkeep'), '');
        }
      });
      
      // Create base index.ts files
      directories.forEach(dir => {
        if (dir.startsWith('src/')) {
          const indexPath = path.join(projectDir, dir, 'index.ts');
          if (!fs.existsSync(indexPath)) {
            fs.writeFileSync(indexPath, '// Export components from this directory\n');
          }
        }
      });
      
      // Update package.json with additional dependencies
      this.updatePackageJson(projectDir, appSpec);
      
    } catch (error) {
      this.logger.error('Error creating React Native project structure', error);
      throw error;
    }
  }

  /**
   * Initialize React Native project
   */
  private initializeReactNativeProject(projectDir: string, appSpec: any): void {
    try {
      const appName = appSpec.appName.replace(/\s+/g, '');
      const templateArg = '--template react-native-template-typescript';
      
      // Initialize React Native project
      const initCommand = `npx react-native init ${appName} ${templateArg}`;
      execSync(initCommand, { cwd: path.dirname(projectDir) });
      
      // Copy generated files to project directory if needed
      if (path.basename(projectDir) !== appName) {
        const generatedProjectDir = path.join(path.dirname(projectDir), appName);
        
        // Copy all files from generated project to actual project directory
        fs.cpSync(generatedProjectDir, projectDir, { recursive: true });
        
        // Delete the temporary generated project
        fs.rmSync(generatedProjectDir, { recursive: true, force: true });
      }
      
      // Create src directory if it doesn't exist
      const srcDir = path.join(projectDir, 'src');
      if (!fs.existsSync(srcDir)) {
        fs.mkdirSync(srcDir);
      }
      
      // Create App.tsx in src directory
      const appTsxContent = this.generateAppTsx(appSpec);
      fs.writeFileSync(path.join(srcDir, 'App.tsx'), appTsxContent);
      
      // Update index.js to point to App.tsx in src directory
      const indexJsPath = path.join(projectDir, 'index.js');
      if (fs.existsSync(indexJsPath)) {
        const indexJsContent = fs.readFileSync(indexJsPath, 'utf8');
        const updatedIndexJsContent = indexJsContent.replace(
          "import App from './App';",
          "import App from './src/App';"
        );
        fs.writeFileSync(indexJsPath, updatedIndexJsContent);
      }
      
      // Delete root App.tsx if it exists
      const rootAppTsxPath = path.join(projectDir, 'App.tsx');
      if (fs.existsSync(rootAppTsxPath)) {
        fs.unlinkSync(rootAppTsxPath);
      }
    } catch (error) {
      this.logger.error('Error initializing React Native project', error);
      throw error;
    }
  }

  /**
   * Update package.json with additional dependencies
   */
  private updatePackageJson(projectDir: string, appSpec: any): void {
    try {
      const packageJsonPath = path.join(projectDir, 'package.json');
      
      if (fs.existsSync(packageJsonPath)) {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        
        // Add dependencies
        packageJson.dependencies = {
          ...packageJson.dependencies,
          '@react-navigation/native': '^6.1.7',
          '@react-navigation/stack': '^6.3.17',
          '@react-navigation/bottom-tabs': '^6.5.8',
          'axios': '^1.4.0',
          'react-native-gesture-handler': '^2.12.1',
          'react-native-reanimated': '^3.4.2',
          'react-native-safe-area-context': '^4.7.2',
          'react-native-screens': '^3.25.0',
          'react-native-vector-icons': '^10.0.0',
          'react-native-mmkv': '^2.10.2',
          'formik': '^2.4.3',
          'yup': '^1.2.0',
        };
        
        // Add authentication dependencies if needed
        if (appSpec.authentication) {
          if (appSpec.authentication.type === 'JWT' || appSpec.authentication.type === 'OAuth2') {
            packageJson.dependencies['@react-native-async-storage/async-storage'] = '^1.19.3';
          }
          
          if (appSpec.authentication.type === 'OAuth2') {
            packageJson.dependencies['react-native-app-auth'] = '^6.4.3';
          }
        }
        
        // Add database dependencies if needed
        if (appSpec.databaseRequirements) {
          if (appSpec.databaseRequirements.type === 'SQLite') {
            packageJson.dependencies['react-native-sqlite-storage'] = '^6.0.1';
          } else if (appSpec.databaseRequirements.type === 'Realm') {
            packageJson.dependencies['realm'] = '^11.10.2';
          } else if (appSpec.databaseRequirements.type === 'Firebase') {
            packageJson.dependencies['@react-native-firebase/app'] = '^18.3.1';
            packageJson.dependencies['@react-native-firebase/firestore'] = '^18.3.1';
          }
        }
        
        // Add dev dependencies
        packageJson.devDependencies = {
          ...packageJson.devDependencies,
          '@types/react-native-vector-icons': '^6.4.14',
          'eslint-plugin-react-hooks': '^4.6.0',
        };
        
        // Write updated package.json
        fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
      }
    } catch (error) {
      this.logger.error('Error updating package.json', error);
      // Continue even if there's an error updating package.json
    }
  }

  /**
   * Generate base files for the project
   */
  async generateBaseFiles(projectDir: string, appSpec: any): Promise<void> {
    try {
      // Generate theme files
      await this.generateThemeFiles(projectDir, appSpec);
      
      // Generate utility files
      await this.generateUtilityFiles(projectDir, appSpec);
      
      // Generate context files
      await this.generateContextFiles(projectDir, appSpec);
      
      // Generate hook files
      await this.generateHookFiles(projectDir, appSpec);
    } catch (error) {
      this.logger.error('Error generating base files', error);
      throw error;
    }
  }

  /**
   * Generate theme files
   */
  private async generateThemeFiles(projectDir: string, appSpec: any): Promise<void> {
    try {
      const themeDir = path.join(projectDir, this.getThemeDir());
      
      // Create theme context
      const themeContextContent = this.generateThemeContext(appSpec);
      fs.writeFileSync(path.join(themeDir, 'ThemeContext.tsx'), themeContextContent);
      
      // Create theme file
      const themeContent = this.generateTheme(appSpec);
      fs.writeFileSync(path.join(themeDir, 'theme.ts'), themeContent);
      
      // Create theme types
      const themeTypesContent = this.generateThemeTypes(appSpec);
      fs.writeFileSync(path.join(themeDir, 'types.ts'), themeTypesContent);
    } catch (error) {
      this.logger.error('Error generating theme files', error);
      throw error;
    }
  }

  /**
   * Generate utility files
   */
  private async generateUtilityFiles(projectDir: string, appSpec: any): Promise<void> {
    try {
      const utilsDir = path.join(projectDir, this.getUtilsDir());
      
      // Create validation utility
      const validationUtilContent = this.generateValidationUtil();
      fs.writeFileSync(path.join(utilsDir, 'validation.ts'), validationUtilContent);
      
      // Create date utility
      const dateUtilContent = this.generateDateUtil();
      fs.writeFileSync(path.join(utilsDir, 'date.ts'), dateUtilContent);
      
      // Create string utility
      const stringUtilContent = this.generateStringUtil();
      fs.writeFileSync(path.join(utilsDir, 'string.ts'), stringUtilContent);
      
      // Create error handling utility
      const errorUtilContent = this.generateErrorUtil();
      fs.writeFileSync(path.join(utilsDir, 'error.ts'), errorUtilContent);
      
      // Create logger utility
      const loggerUtilContent = this.generateLoggerUtil();
      fs.writeFileSync(path.join(utilsDir, 'logger.ts'), loggerUtilContent);
    } catch (error) {
      this.logger.error('Error generating utility files', error);
      throw error;
    }
  }

  /**
   * Generate context files
   */
  private async generateContextFiles(projectDir: string, appSpec: any): Promise<void> {
    try {
      const contextsDir = path.join(projectDir, this.getContextsDir());
      
      // Create authentication context if needed
      if (appSpec.authentication) {
        const authContextContent = this.generateAuthContext(appSpec.authentication);
        fs.writeFileSync(path.join(contextsDir, 'AuthContext.tsx'), authContextContent);
      }
      
      // Create other contexts based on app functionality
      if (this.hasFeature(appSpec, 'e-commerce')) {
        const cartContextContent = this.generateCartContext();
        fs.writeFileSync(path.join(contextsDir, 'CartContext.tsx'), cartContextContent);
      }
      
      // Create app context for global state
      const appContextContent = this.generateAppContext(appSpec);
      fs.writeFileSync(path.join(contextsDir, 'AppContext.tsx'), appContextContent);
    } catch (error) {
      this.logger.error('Error generating context files', error);
      throw error;
    }
  }

  /**
   * Generate hook files
   */
  private async generateHookFiles(projectDir: string, appSpec: any): Promise<void> {
    try {
      const hooksDir = path.join(projectDir, this.getHooksDir());
      
      // Create useForm hook
      const useFormHookContent = this.generateUseFormHook();
      fs.writeFileSync(path.join(hooksDir, 'useForm.ts'), useFormHookContent);
      
      // Create useApi hook
      const useApiHookContent = this.generateUseApiHook();
      fs.writeFileSync(path.join(hooksDir, 'useApi.ts'), useApiHookContent);
      
      // Create useAuth hook if needed
      if (appSpec.authentication) {
        const useAuthHookContent = this.generateUseAuthHook(appSpec.authentication);
        fs.writeFileSync(path.join(hooksDir, 'useAuth.ts'), useAuthHookContent);
      }
      
      // Create other hooks based on app functionality
      if (this.hasFeature(appSpec, 'offline')) {
        const useOfflineHookContent = this.generateUseOfflineHook();
        fs.writeFileSync(path.join(hooksDir, 'useOffline.ts'), useOfflineHookContent);
      }
    } catch (error) {
      this.logger.error('Error generating hook files', error);
      throw error;
    }
  }

  /**
   * Generate navigation
   */
  async generateNavigation(projectDir: string, appSpec: any): Promise<void> {
    try {
      const navigationDir = path.join(projectDir, this.getNavigationDir());
      
      // Generate main navigator
      const mainNavigatorContent = this.generateMainNavigator(appSpec);
      fs.writeFileSync(path.join(navigationDir, 'AppNavigator.tsx'), mainNavigatorContent);
      
      // Generate authentication navigator if needed
      if (appSpec.authentication) {
        const authNavigatorContent = this.generateAuthNavigator(appSpec);
        fs.writeFileSync(path.join(navigationDir, 'AuthNavigator.tsx'), authNavigatorContent);
      }
      
      // Generate navigation types
      const navigationTypesContent = this.generateNavigationTypes(appSpec);
      fs.writeFileSync(path.join(navigationDir, 'types.ts'), navigationTypesContent);
      
      // Generate navigation utilities
      const navigationUtilContent = this.generateNavigationUtil();
      fs.writeFileSync(path.join(navigationDir, 'navigationUtils.ts'), navigationUtilContent);
    } catch (error) {
      this.logger.error('Error generating navigation', error);
      throw error;
    }
  }

  /**
   * Generate model
   */
  generateModel(modelName: string, model: any): string {
    try {
      // Create TypeScript interface for the model
      let modelContent = `
// ${modelName} model
export interface ${modelName} {
`;
      
      // Add fields
      if (model.fields && model.fields.length > 0) {
        model.fields.forEach((field: any) => {
          const fieldType = this.mapFieldTypeToTypeScript(field.type);
          const isRequired = field.required ? '' : '?';
          modelContent += `  ${field.name}${isRequired}: ${fieldType};\n`;
        });
      }
      
      modelContent += `}

// ${modelName} creation DTO
export interface Create${modelName}DTO {
`;
      
      // Add fields for DTO
      if (model.fields && model.fields.length > 0) {
        model.fields.forEach((field: any) => {
          // Skip ID and timestamp fields in creation DTO
          if (!['id', 'createdAt', 'updatedAt'].includes(field.name)) {
            const fieldType = this.mapFieldTypeToTypeScript(field.type);
            const isRequired = field.required ? '' : '?';
            modelContent += `  ${field.name}${isRequired}: ${fieldType};\n`;
          }
        });
      }
      
      modelContent += `}

// ${modelName} update DTO
export interface Update${modelName}DTO {
`;
      
      // Add fields for update DTO
      if (model.fields && model.fields.length > 0) {
        model.fields.forEach((field: any) => {
          // Skip ID and timestamp fields in update DTO
          if (!['id', 'createdAt', 'updatedAt'].includes(field.name)) {
            const fieldType = this.mapFieldTypeToTypeScript(field.type);
            // All fields are optional in update DTO
            modelContent += `  ${field.name}?: ${fieldType};\n`;
          }
        });
      }
      
      modelContent += `}
`;
      
      return modelContent;
    } catch (error) {
      this.logger.error(`Error generating model: ${modelName}`, error);
      return `// Error generating model ${modelName}\n// ${error.message}\n`;
    }
  }

  /**
   * Generate database schema
   */
  generateDatabaseSchema(dbSchema: any): string {
    try {
      let schemaContent = `
// Database schema
import { DatabaseAdapter } from './adapters';

export const schema = {
  name: 'AppDatabase',
  version: 1,
  tables: [
`;
      
      // Add tables
      if (dbSchema.tables && dbSchema.tables.length > 0) {
        dbSchema.tables.forEach((table: any, index: number) => {
          schemaContent += `    {
      name: '${table.name}',
      columns: [
`;
          
          // Add columns
          if (table.columns && table.columns.length > 0) {
            table.columns.forEach((column: any, colIndex: number) => {
              const columnType = this.mapColumnTypeToDatabase(column.type);
              const constraints = column.constraints ? column.constraints.join(', ') : '';
              
              schemaContent += `        {
          name: '${column.name}',
          type: '${columnType}',
          constraints: [${constraints}],
        }${colIndex < table.columns.length - 1 ? ',' : ''}
`;
            });
          }
          
          schemaContent += `      ],
      primaryKey: '${table.columns.find((col: any) => col.constraints?.includes('PRIMARY KEY'))?.name || 'id'}',
      indices: [
`;
          
          // Add indices
          if (table.indexes && table.indexes.length > 0) {
            table.indexes.forEach((index: any, idxIndex: number) => {
              schemaContent += `        {
          name: '${index.name}',
          columns: [${index.columns.map((col: string) => `'${col}'`).join(', ')}],
          type: '${index.type || 'DEFAULT'}',
        }${idxIndex < table.indexes.length - 1 ? ',' : ''}
`;
            });
          }
          
          schemaContent += `      ],
    }${index < dbSchema.tables.length - 1 ? ',' : ''}
`;
        });
      }
      
      schemaContent += `  ],
};

// Initialize the database
export const initializeDatabase = async (): Promise<void> => {
  try {
    await DatabaseAdapter.initialize(schema);
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Failed to initialize database', error);
    throw error;
  }
};

// Database migrations
export const migrations = [
  // Add migrations here
];
`;
      
      return schemaContent;
    } catch (error) {
      this.logger.error('Error generating database schema', error);
      return `// Error generating database schema\n// ${error.message}\n`;
    }
  }

  /**
   * Generate API service
   */
  generateAPIService(endpoints: any[]): string {
    try {
      let apiServiceContent = `
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { getAuthToken } from '../utils/auth';
import { handleApiError } from '../utils/error';

// API base URL
const API_BASE_URL = 'https://api.example.com'; // Replace with your API URL

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds timeout
});

// Request interceptor
api.interceptors.request.use(
  async (config: AxiosRequestConfig) => {
    // Get auth token and add to headers if available
    const token = await getAuthToken();
    if (token) {
      config.headers = {
        ...config.headers,
        Authorization: \`Bearer \${token}\`,
      };
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error) => {
    return Promise.reject(handleApiError(error));
  }
);

// API service methods
export const apiService = {
  // Generic methods
  get: async <T>(url: string, params?: any): Promise<T> => {
    try {
      const response = await api.get<T>(url, { params });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },
  
  post: async <T>(url: string, data?: any): Promise<T> => {
    try {
      const response = await api.post<T>(url, data);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },
  
  put: async <T>(url: string, data?: any): Promise<T> => {
    try {
      const response = await api.put<T>(url, data);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },
  
  patch: async <T>(url: string, data?: any): Promise<T> => {
    try {
      const response = await api.patch<T>(url, data);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },
  
  delete: async <T>(url: string): Promise<T> => {
    try {
      const response = await api.delete<T>(url);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },
`;
      
      // Add endpoint-specific methods
      if (endpoints && endpoints.length > 0) {
        apiServiceContent += `\n  // Endpoint-specific methods\n`;
        
        endpoints.forEach(endpoint => {
          const methodName = this.getMethodNameFromEndpoint(endpoint);
          const method = endpoint.method.toLowerCase();
          const path = endpoint.path;
          const pathParams = this.extractPathParams(path);
          const hasParams = pathParams.length > 0;
          const hasBody = ['post', 'put', 'patch'].includes(method);
          
          apiServiceContent += `  ${methodName}: async <T>(`;
          
          // Add method parameters
          if (hasParams) {
            pathParams.forEach((param, index) => {
              apiServiceContent += `${param}: string | number`;
              if (index < pathParams.length - 1 || hasBody) {
                apiServiceContent += ', ';
              }
            });
          }
          
          if (hasBody) {
            apiServiceContent += `data: any`;
          }
          
          if (method === 'get') {
            if (hasParams) {
              apiServiceContent += ', ';
            }
            apiServiceContent += `params?: any`;
          }
          
          apiServiceContent += `): Promise<T> => {
    try {
      `;
          
          // Add method implementation
          const formattedPath = this.formatEndpointPath(path);
          
          if (method === 'get') {
            apiServiceContent += `const response = await api.get<T>(\`${formattedPath}\`, { params });`;
          } else if (['post', 'put', 'patch'].includes(method)) {
            apiServiceContent += `const response = await api.${method}<T>(\`${formattedPath}\`, data);`;
          } else {
            apiServiceContent += `const response = await api.delete<T>(\`${formattedPath}\`);`;
          }
          
          apiServiceContent += `
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },
`;
        });
      }
      
      apiServiceContent += `};

export default api;
`;
      
      return apiServiceContent;
    } catch (error) {
      this.logger.error('Error generating API service', error);
      return `// Error generating API service\n// ${error.message}\n`;
    }
  }

  /**
   * Generate domain service
   */
  generateDomainService(domain: string, endpoints: any[]): string {
    try {
      const capitalizedDomain = domain.charAt(0).toUpperCase() + domain.slice(1);
      let domainServiceContent = `
import { apiService } from './api';
import { handle${capitalizedDomain}Error } from '../utils/error';
`;
      
      // Add imports for domain-specific models
      domainServiceContent += `import {`;
      const modelNames = new Set<string>();
      
      endpoints.forEach(endpoint => {
        if (endpoint.response?.success) {
          const responseType = this.guessModelNameFromEndpoint(endpoint, domain);
          if (responseType) {
            modelNames.add(responseType);
          }
        }
      });
      
      modelNames.forEach(model => {
        domainServiceContent += `\n  ${model},`;
      });
      
      domainServiceContent += `\n} from '../models';

// ${capitalizedDomain} service
export const ${domain}Service = {`;
      
      // Add methods
      endpoints.forEach(endpoint => {
        const methodName = this.getMethodNameFromEndpoint(endpoint, domain);
        const method = endpoint.method.toLowerCase();
        const responseType = this.guessModelNameFromEndpoint(endpoint, domain) || 'any';
        const pathParams = this.extractPathParams(endpoint.path);
        const hasParams = pathParams.length > 0;
        const hasBody = ['post', 'put', 'patch'].includes(method);
        
        domainServiceContent += `
  ${methodName}: async (`;
        
        // Add method parameters
        if (hasParams) {
          pathParams.forEach((param, index) => {
            domainServiceContent += `${param}: string | number`;
            if (index < pathParams.length - 1 || hasBody) {
              domainServiceContent += ', ';
            }
          });
        }
        
        if (hasBody) {
          const bodyType = this.guessRequestBodyType(endpoint, domain);
          domainServiceContent += `data: ${bodyType}`;
        }
        
        if (method === 'get') {
          if (hasParams) {
            domainServiceContent += ', ';
          }
          domainServiceContent += `params?: any`;
        }
        
        domainServiceContent += `): Promise<${responseType === 'void' ? 'void' : responseType}> => {
    try {
      `;
        
        // Determine return type based on response
        const isArrayResponse = endpoint.path.endsWith('s') && !endpoint.path.includes(':id');
        const returnType = isArrayResponse ? `${responseType}[]` : responseType;
        
        // Add method implementation
        if (method === 'get') {
          if (hasParams) {
            domainServiceContent += `return await apiService.${methodName}<${returnType}>(${pathParams.join(', ')}, params);`;
          } else {
            domainServiceContent += `return await apiService.${methodName}<${returnType}>(params);`;
          }
        } else if (['post', 'put', 'patch'].includes(method)) {
          if (hasParams) {
            domainServiceContent += `return await apiService.${methodName}<${returnType}>(${pathParams.join(', ')}, data);`;
          } else {
            domainServiceContent += `return await apiService.${methodName}<${returnType}>(data);`;
          }
        } else {
          domainServiceContent += `return await apiService.${methodName}<${returnType}>(${pathParams.join(', ')});`;
        }
        
        domainServiceContent += `
    } catch (error) {
      throw handle${capitalizedDomain}Error(error);
    }
  },`;
      });
      
      domainServiceContent += `
};

export default ${domain}Service;
`;
      
      return domainServiceContent;
    } catch (error) {
      this.logger.error(`Error generating domain service: ${domain}`, error);
      return `// Error generating ${domain} service\n// ${error.message}\n`;
    }
  }

  /**
   * Generate authentication
   */
  async generateAuthentication(projectDir: string, authentication: any): Promise<void> {
    try {
      const authDir = path.join(projectDir, this.getUtilsDir());
      
      // Generate auth utility
      const authUtilContent = this.generateAuthUtil(authentication);
      fs.writeFileSync(path.join(authDir, 'auth.ts'), authUtilContent);
      
      // Generate auth service
      const servicesDir = path.join(projectDir, this.getServicesDir());
      const authServiceContent = this.generateAuthService(authentication);
      fs.writeFileSync(path.join(servicesDir, 'authService.ts'), authServiceContent);
    } catch (error) {
      this.logger.error('Error generating authentication', error);
      throw error;
    }
  }

  /**
   * Generate database integration
   */
  async generateDatabaseIntegration(projectDir: string, dbSchema: any): Promise<void> {
    try {
      const dbDir = path.join(projectDir, 'src/services/db');
      
      // Generate database adapter
      const dbAdapterContent = this.generateDatabaseAdapter(dbSchema);
      fs.writeFileSync(path.join(dbDir, 'adapters.ts'), dbAdapterContent);
      
      // Generate database repository
      const dbRepositoryContent = this.generateDatabaseRepository(dbSchema);
      fs.writeFileSync(path.join(dbDir, 'repository.ts'), dbRepositoryContent);
    } catch (error) {
      this.logger.error('Error generating database integration', error);
      throw error;
    }
  }

  /**
   * Generate tests
   */
  async generateTests(projectDir: string, appSpec: any): Promise<void> {
    try {
      const testsDir = path.join(projectDir, '__tests__');
      
      // Generate component tests
      const componentsTestsDir = path.join(testsDir, 'components');
      const componentTestContent = this.generateComponentTest();
      fs.writeFileSync(path.join(componentsTestsDir, 'Button.test.tsx'), componentTestContent);
      
      // Generate screen tests
      const screensTestsDir = path.join(testsDir, 'screens');
      if (appSpec.screens && appSpec.screens.length > 0) {
        const screenName = this.formatComponentName(appSpec.screens[0].name);
        const screenTestContent = this.generateScreenTest(screenName);
        fs.writeFileSync(path.join(screensTestsDir, `${screenName}Screen.test.tsx`), screenTestContent);
      }
      
      // Generate service tests
      const servicesTestsDir = path.join(testsDir, 'services');
      const serviceTestContent = this.generateServiceTest();
      fs.writeFileSync(path.join(servicesTestsDir, 'api.test.ts'), serviceTestContent);
    } catch (error) {
      this.logger.error('Error generating tests', error);
      throw error;
    }
  }

  /**
   * Generate a basic component
   */
  generateBasicComponent(componentName: string, uiDesign: any): string {
    return `
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

interface ${componentName}Props {
  // Add props here
}

const ${componentName}: React.FC<${componentName}Props> = (props) => {
  const { theme } = useTheme();
  
  return (
    <View style={styles.container}>
      <Text style={[styles.text, { color: theme.colors.text }]}>${componentName}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  text: {
    fontSize: 16,
  },
});

export default ${componentName};
`;
  }

  /**
   * Generate a basic screen
   */
  generateBasicScreen(screenName: string, screen: any, uiDesign: any): string {
    return `
import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';

type ${screenName}ScreenProps = StackScreenProps<RootStackParamList, '${screenName}'>;

const ${screenName}Screen: React.FC<${screenName}ScreenProps> = ({ navigation, route }) => {
  const { theme } = useTheme();
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.title, { color: theme.colors.text }]}>${screen.name}</Text>
        <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
          ${screen.description || `This is the ${screen.name} screen`}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    marginBottom: 16,
  },
});

export default ${screenName}Screen;
`;
  }

  /**
   * Check if app has a specific feature
   */
  private hasFeature(appSpec: any, featureName: string): boolean {
    if (!appSpec.features) {
      return false;
    }
    
    return appSpec.features.some((feature: any) => 
      feature.name.toLowerCase().includes(featureName.toLowerCase()) ||
      (feature.description && feature.description.toLowerCase().includes(featureName.toLowerCase()))
    );
  }

  /**
   * Map field type to TypeScript type
   */
  private mapFieldTypeToTypeScript(fieldType: string): string {
    fieldType = fieldType.toLowerCase();
    
    if (fieldType.includes('string') || fieldType.includes('text') || fieldType.includes('char')) {
      return 'string';
    } else if (fieldType.includes('int') || fieldType.includes('number') || fieldType.includes('float') || fieldType.includes('double')) {
      return 'number';
    } else if (fieldType.includes('bool')) {
      return 'boolean';
    } else if (fieldType.includes('date')) {
      return 'Date';
    } else if (fieldType.includes('array')) {
      return 'any[]';
    } else if (fieldType.includes('object')) {
      return 'Record<string, any>';
    } else if (fieldType.includes('id')) {
      return 'string';
    } else {
      return 'any';
    }
  }

  /**
   * Map column type to database type
   */
  private mapColumnTypeToDatabase(columnType: string): string {
    columnType = columnType.toLowerCase();
    
    if (columnType.includes('string') || columnType.includes('text') || columnType.includes('char')) {
      return 'TEXT';
    } else if (columnType.includes('int')) {
      return 'INTEGER';
    } else if (columnType.includes('float') || columnType.includes('double') || columnType.includes('decimal')) {
      return 'REAL';
    } else if (columnType.includes('bool')) {
      return 'INTEGER';
    } else if (columnType.includes('date')) {
      return 'TEXT';
    } else if (columnType.includes('blob')) {
      return 'BLOB';
    } else {
      return 'TEXT';
    }
  }

  /**
   * Get method name from endpoint
   */
  private getMethodNameFromEndpoint(endpoint: any, domain?: string): string {
    const method = endpoint.method.toLowerCase();
    const path = endpoint.path;
    const pathParts = path.split('/').filter(Boolean);
    
    if (pathParts.length === 0) {
      return `${method}Data`;
    }
    
    // Remove domain from path parts if provided
    const parts = domain ? pathParts.filter(part => part !== domain) : pathParts;
    
    if (parts.length === 0) {
      // If no parts left after removing domain, use the method + domain
      return `${method}${domain ? this.capitalize(domain) : 'Data'}`;
    }
    
    // Check if path contains an ID parameter
    const hasIdParam = parts.some(part => part.startsWith(':') || part.includes('{'));
    
    // Generate method name based on HTTP method and path
    switch (method) {
      case 'get':
        if (hasIdParam) {
          return `get${this.capitalize(parts[0].replace(/s$/, ''))}ById`;
        } else if (parts.length > 1) {
          return `get${this.capitalize(parts[0].replace(/s$/, ''))}${this.capitalize(parts[1])}`;
        } else {
          return `get${this.capitalize(parts[0])}`;
        }
      case 'post':
        if (parts.length > 1) {
          return `create${this.capitalize(parts[0].replace(/s$/, ''))}${this.capitalize(parts[1])}`;
        } else {
          return `create${this.capitalize(parts[0].replace(/s$/, ''))}`;
        }
      case 'put':
      case 'patch':
        if (hasIdParam) {
          return `update${this.capitalize(parts[0].replace(/s$/, ''))}`;
        } else if (parts.length > 1) {
          return `update${this.capitalize(parts[0].replace(/s$/, ''))}${this.capitalize(parts[1])}`;
        } else {
          return `update${this.capitalize(parts[0].replace(/s$/, ''))}`;
        }
      case 'delete':
        if (hasIdParam) {
          return `delete${this.capitalize(parts[0].replace(/s$/, ''))}`;
        } else if (parts.length > 1) {
          return `delete${this.capitalize(parts[0].replace(/s$/, ''))}${this.capitalize(parts[1])}`;
        } else {
          return `delete${this.capitalize(parts[0].replace(/s$/, ''))}`;
        }
      default:
        return `${method}${this.capitalize(parts[0])}`;
    }
  }

  /**
   * Capitalize a string
   */
  private capitalize(str: string): string {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /**
   * Extract path parameters from endpoint path
   */
  private extractPathParams(path: string): string[] {
    const params: string[] = [];
    const parts = path.split('/');
    
    parts.forEach(part => {
      if (part.startsWith(':')) {
        params.push(part.substring(1));
      } else if (part.includes('{') && part.includes('}')) {
        const param = part.match(/{([^}]+)}/);
        if (param) {
          params.push(param[1]);
        }
      }
    });
    
    return params;
  }

  /**
   * Format endpoint path for template
   */
  private formatEndpointPath(path: string): string {
    // Replace :paramName with ${paramName}
    return path.replace(/:([a-zA-Z0-9_]+)/g, '${$1}');
  }

  /**
   * Guess model name from endpoint
   */
  private guessModelNameFromEndpoint(endpoint: any, domain: string): string {
    const method = endpoint.method.toLowerCase();
    const path = endpoint.path;
    const pathParts = path.split('/').filter(Boolean);
    
    // Remove domain from path parts
    const parts = pathParts.filter(part => part !== domain);
    
    if (parts.length === 0) {
      // If only domain, use the domain as the model name
      const singularDomain = domain.endsWith('s') ? domain.slice(0, -1) : domain;
      return this.capitalize(singularDomain);
    }
    
    // Get the resource name (typically the first part after domain)
    let resourceName = parts[0];
    
    // Check if it's a path parameter (starts with : or {)
    if (resourceName.startsWith(':') || resourceName.includes('{')) {
      // Use the domain as the base for the model name
      resourceName = domain;
    }
    
    // Convert to singular form if it's plural
    if (resourceName.endsWith('s')) {
      resourceName = resourceName.slice(0, -1);
    }
    
    // Capitalize
    const modelName = this.capitalize(resourceName);
    
    // If it's a DELETE endpoint, return void
    if (method === 'delete') {
      return 'void';
    }
    
    return modelName;
  }

  /**
   * Guess request body type for an endpoint
   */
  private guessRequestBodyType(endpoint: any, domain: string): string {
    const method = endpoint.method.toLowerCase();
    const path = endpoint.path;
    const pathParts = path.split('/').filter(Boolean);
    
    // Remove domain from path parts
    const parts = pathParts.filter(part => part !== domain);
    
    if (parts.length === 0) {
      // If only domain, use the domain as the model name
      const singularDomain = domain.endsWith('s') ? domain.slice(0, -1) : domain;
      const modelName = this.capitalize(singularDomain);
      
      if (method === 'post') {
        return `Create${modelName}DTO`;
      } else if (method === 'put' || method === 'patch') {
        return `Update${modelName}DTO`;
      }
    }
    
    // Get the resource name (typically the first part after domain)
    let resourceName = parts[0];
    
    // Check if it's a path parameter (starts with : or {)
    if (resourceName.startsWith(':') || resourceName.includes('{')) {
      // Use the domain as the base for the model name
      resourceName = domain;
    }
    
    // Convert to singular form if it's plural
    if (resourceName.endsWith('s')) {
      resourceName = resourceName.slice(0, -1);
    }
    
    // Capitalize
    const modelName = this.capitalize(resourceName);
    
    if (method === 'post') {
      return `Create${modelName}DTO`;
    } else if (method === 'put' || method === 'patch') {
      return `Update${modelName}DTO`;
    } else {
      return 'any';
    }
  }

  /**
   * Generate App.tsx
   */
  private generateAppTsx(appSpec: any): string {
    const hasAuth = !!appSpec.authentication;
    
    return `
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { ThemeProvider } from './theme/ThemeContext';
import AppNavigator from './navigation/AppNavigator';
${hasAuth ? "import { AuthProvider } from './contexts/AuthContext';" : ''}
import { AppProvider } from './contexts/AppContext';

const App: React.FC = () => {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
${hasAuth ? '        <AuthProvider>\n' : ''}
        <AppProvider>
          <NavigationContainer>
            <AppNavigator />
          </NavigationContainer>
        </AppProvider>
${hasAuth ? '        </AuthProvider>\n' : ''}
      </ThemeProvider>
    </SafeAreaProvider>
  );
};

export default App;
`;
  }

  /**
   * Generate theme context
   */
  private generateThemeContext(appSpec: any): string {
    const defaultPrimaryColor = appSpec.theme?.colorPalette?.primary || '#007BFF';
    
    return `
import React, { createContext, useState, useContext, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { lightTheme, darkTheme } from './theme';
import { ThemeType } from './types';
import { MMKV } from 'react-native-mmkv';

// Create storage for theme preferences
const storage = new MMKV();

// Theme context
interface ThemeContextType {
  theme: ThemeType;
  isDarkMode: boolean;
  toggleTheme: () => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: lightTheme,
  isDarkMode: false,
  toggleTheme: () => {},
  setTheme: () => {},
});

// Theme provider
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const colorScheme = useColorScheme();
  const [themeMode, setThemeMode] = useState<'light' | 'dark' | 'system'>('system');
  
  // Load saved theme preference
  useEffect(() => {
    const savedTheme = storage.getString('themeMode');
    if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark' || savedTheme === 'system')) {
      setThemeMode(savedTheme);
    }
  }, []);
  
  // Determine if dark mode is active
  const isDarkMode = themeMode === 'system' 
    ? colorScheme === 'dark'
    : themeMode === 'dark';
  
  // Get current theme
  const theme = isDarkMode ? darkTheme : lightTheme;
  
  // Toggle between light and dark mode
  const toggleTheme = () => {
    const newTheme = isDarkMode ? 'light' : 'dark';
    setThemeMode(newTheme);
    storage.set('themeMode', newTheme);
  };
  
  // Set specific theme
  const setTheme = (mode: 'light' | 'dark' | 'system') => {
    setThemeMode(mode);
    storage.set('themeMode', mode);
  };
  
  return (
    <ThemeContext.Provider value={{ theme, isDarkMode, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Hook to use theme
export const useTheme = () => useContext(ThemeContext);

export default ThemeContext;
`;
  }

  /**
   * Generate theme
   */
  private generateTheme(appSpec: any): string {
    const primaryColor = appSpec.theme?.colorPalette?.primary || '#007BFF';
    const secondaryColor = appSpec.theme?.colorPalette?.secondary || '#6C757D';
    const accentColor = appSpec.theme?.colorPalette?.accent || '#FFC107';
    
    return `
import { ThemeType } from './types';

// Light theme
export const lightTheme: ThemeType = {
  colors: {
    primary: '${primaryColor}',
    secondary: '${secondaryColor}',
    accent: '${accentColor}',
    background: '#FFFFFF',
    surface: '#F8F9FA',
    error: '#DC3545',
    text: '#212529',
    textSecondary: '#6C757D',
    border: '#DEE2E6',
    disabled: '#CED4DA',
    divider: '#E9ECEF',
    icon: '#6C757D',
    shadow: 'rgba(0, 0, 0, 0.1)',
  },
  typography: {
    fontFamily: {
      regular: 'System',
      medium: 'System',
      bold: 'System',
    },
    fontSize: {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 18,
      xl: 20,
      xxl: 24,
      xxxl: 30,
    },
    lineHeight: {
      xs: 16,
      sm: 20,
      md: 24,
      lg: 28,
      xl: 32,
      xxl: 36,
      xxxl: 42,
    },
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
    xxxl: 64,
  },
  borderRadius: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    round: 9999,
  },
  shadows: {
    none: 'none',
    xs: '0px 1px 2px rgba(0, 0, 0, 0.05)',
    sm: '0px 1px 3px rgba(0, 0, 0, 0.1), 0px 1px 2px rgba(0, 0, 0, 0.06)',
    md: '0px 4px 6px -1px rgba(0, 0, 0, 0.1), 0px 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0px 10px 15px -3px rgba(0, 0, 0, 0.1), 0px 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0px 20px 25px -5px rgba(0, 0, 0, 0.1), 0px 10px 10px -5px rgba(0, 0, 0, 0.04)',
  },
};

// Dark theme
export const darkTheme: ThemeType = {
  colors: {
    primary: '${primaryColor}',
    secondary: '${secondaryColor}',
    accent: '${accentColor}',
    background: '#121212',
    surface: '#1E1E1E',
    error: '#F44336',
    text: '#FFFFFF',
    textSecondary: '#B0B0B0',
    border: '#333333',
    disabled: '#666666',
    divider: '#2D2D2D',
    icon: '#B0B0B0',
    shadow: 'rgba(0, 0, 0, 0.2)',
  },
  typography: lightTheme.typography,
  spacing: lightTheme.spacing,
  borderRadius: lightTheme.borderRadius,
  shadows: {
    none: 'none',
    xs: '0px 1px 2px rgba(0, 0, 0, 0.25)',
    sm: '0px 1px 3px rgba(0, 0, 0, 0.3), 0px 1px 2px rgba(0, 0, 0, 0.2)',
    md: '0px 4px 6px -1px rgba(0, 0, 0, 0.3), 0px 2px 4px -1px rgba(0, 0, 0, 0.2)',
    lg: '0px 10px 15px -3px rgba(0, 0, 0, 0.3), 0px 4px 6px -2px rgba(0, 0, 0, 0.2)',
    xl: '0px 20px 25px -5px rgba(0, 0, 0, 0.3), 0px 10px 10px -5px rgba(0, 0, 0, 0.2)',
  },
};

export default { lightTheme, darkTheme };
`;
  }

  /**
   * Generate theme types
   */
  private generateThemeTypes(appSpec: any): string {
    return `
// Theme types
export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  error: string;
  text: string;
  textSecondary: string;
  border: string;
  disabled: string;
  divider: string;
  icon: string;
  shadow: string;
}

export interface Typography {
  fontFamily: {
    regular: string;
    medium: string;
    bold: string;
  };
  fontSize: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
    xxxl: number;
  };
  lineHeight: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
    xxxl: number;
  };
}

export interface Spacing {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  xxl: number;
  xxxl: number;
}

export interface BorderRadius {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  round: number;
}

export interface Shadows {
  none: string;
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
}

export interface ThemeType {
  colors: ThemeColors;
  typography: Typography;
  spacing: Spacing;
  borderRadius: BorderRadius;
  shadows: Shadows;
}
`;
  }

  /**
   * Generate validation utility
   */
  private generateValidationUtil(): string {
    return `
// Validation utilities
import * as yup from 'yup';

// Common validation schemas
export const nameSchema = yup
  .string()
  .trim()
  .min(2, 'Name must be at least 2 characters')
  .max(50, 'Name must be less than 50 characters')
  .required('Name is required');

export const emailSchema = yup
  .string()
  .trim()
  .email('Please enter a valid email')
  .required('Email is required');

export const passwordSchema = yup
  .string()
  .min(8, 'Password must be at least 8 characters')
  .matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])/,
    'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
  )
  .required('Password is required');

export const confirmPasswordSchema = (fieldName = 'password') =>
  yup
    .string()
    .oneOf([yup.ref(fieldName)], 'Passwords must match')
    .required('Please confirm your password');

export const phoneSchema = yup
  .string()
  .matches(
    /^[+]?[(]?[0-9]{3}[)]?[-\\s.]?[0-9]{3}[-\\s.]?[0-9]{4,6}$/,
    'Please enter a valid phone number'
  )
  .required('Phone number is required');

// Validation functions
export const validateEmail = (email: string): boolean => {
  return emailSchema.isValidSync(email);
};

export const validatePassword = (password: string): boolean => {
  return passwordSchema.isValidSync(password);
};

export const validatePhone = (phone: string): boolean => {
  return phoneSchema.isValidSync(phone);
};

export default {
  nameSchema,
  emailSchema,
  passwordSchema,
  confirmPasswordSchema,
  phoneSchema,
  validateEmail,
  validatePassword,
  validatePhone,
};
`;
  }

  /**
   * Generate date utility
   */
  private generateDateUtil(): string {
    return `
// Date utilities
import { format, formatDistance, parseISO, isValid } from 'date-fns';

// Format a date using a specified format
export const formatDate = (date: Date | string, formatStr = 'PPP'): string => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(dateObj)) {
      return 'Invalid date';
    }
    return format(dateObj, formatStr);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
};

// Format a date as relative time (e.g., "5 days ago")
export const formatRelativeTime = (date: Date | string): string => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(dateObj)) {
      return 'Invalid date';
    }
    return formatDistance(dateObj, new Date(), { addSuffix: true });
  } catch (error) {
    console.error('Error formatting relative time:', error);
    return 'Invalid date';
  }
};

// Parse a string into a Date object
export const parseDate = (dateStr: string): Date | null => {
  try {
    const date = parseISO(dateStr);
    return isValid(date) ? date : null;
  } catch (error) {
    console.error('Error parsing date:', error);
    return null;
  }
};

// Check if a date is today
export const isToday = (date: Date | string): boolean => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(dateObj)) {
      return false;
    }
    const today = new Date();
    return (
      dateObj.getDate() === today.getDate() &&
      dateObj.getMonth() === today.getMonth() &&
      dateObj.getFullYear() === today.getFullYear()
    );
  } catch (error) {
    console.error('Error checking if date is today:', error);
    return false;
  }
};

export default {
  formatDate,
  formatRelativeTime,
  parseDate,
  isToday,
};
`;
  }

  /**
   * Generate string utility
   */
  private generateStringUtil(): string {
    return `
// String utilities

// Truncate a string to a specified length
export const truncate = (str: string, length = 50, suffix = '...'): string => {
  if (!str) return '';
  return str.length <= length ? str : \`\${str.substring(0, length)}\${suffix}\`;
};

// Convert a string to title case
export const toTitleCase = (str: string): string => {
  if (!str) return '';
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// Format a string to a slug (URL-friendly string)
export const slugify = (str: string): string => {
  if (!str) return '';
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

// Format a number as currency
export const formatCurrency = (
  amount: number,
  currency = 'USD',
  locale = 'en-US'
): string => {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
    }).format(amount);
  } catch (error) {
    console.error('Error formatting currency:', error);
    return \`\${amount}\`;
  }
};

// Format a number with commas
export const formatNumber = (num: number, locale = 'en-US'): string => {
  try {
    return new Intl.NumberFormat(locale).format(num);
  } catch (error) {
    console.error('Error formatting number:', error);
    return \`\${num}\`;
  }
};

// Generate a random string
export const generateRandomString = (length = 10): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export default {
  truncate,
  toTitleCase,
  slugify,
  formatCurrency,
  formatNumber,
  generateRandomString,
};
`;
  }

  /**
   * Generate error utility
   */
  private generateErrorUtil(): string {
    return `
// Error utilities
import axios, { AxiosError } from 'axios';

// Custom error class
export class AppError extends Error {
  code: string;
  status?: number;
  
  constructor(message: string, code = 'UNKNOWN_ERROR', status?: number) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.status = status;
  }
}

// Handle API errors
export const handleApiError = (error: unknown): AppError => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError;
    const status = axiosError.response?.status;
    const errorData = axiosError.response?.data as any;
    
    // Set appropriate error code based on status
    let code = 'API_ERROR';
    let message = 'An error occurred while communicating with the server';
    
    if (status === 401) {
      code = 'UNAUTHORIZED';
      message = 'You are not authorized to perform this action';
    } else if (status === 403) {
      code = 'FORBIDDEN';
      message = 'You do not have permission to access this resource';
    } else if (status === 404) {
      code = 'NOT_FOUND';
      message = 'The requested resource was not found';
    } else if (status === 422) {
      code = 'VALIDATION_ERROR';
      message = 'Validation error';
    } else if (status >= 500) {
      code = 'SERVER_ERROR';
      message = 'A server error occurred';
    }
    
    // Use error message from response if available
    if (errorData?.message) {
      message = errorData.message;
    } else if (errorData?.error) {
      message = typeof errorData.error === 'string' ? errorData.error : 'An error occurred';
    }
    
    return new AppError(message, code, status);
  }
  
  // Handle other errors
  if (error instanceof Error) {
    return new AppError(error.message, 'APP_ERROR');
  }
  
  // Unknown error
  return new AppError('An unexpected error occurred', 'UNKNOWN_ERROR');
};

// Handle domain-specific errors
export const handleAuthError = (error: unknown): AppError => {
  const appError = handleApiError(error);
  
  // Override error code for auth errors
  if (appError.status === 401 || appError.status === 403) {
    appError.code = 'AUTH_ERROR';
  }
  
  return appError;
};

export default {
  AppError,
  handleApiError,
  handleAuthError,
};
`;
  }

  /**
   * Generate logger utility
   */
  private generateLoggerUtil(): string {
    return `
// Logger utility
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

// Environment configuration
const isProd = process.env.NODE_ENV === 'production';
const logLevels: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

// Minimum log level
const minLevel: LogLevel = isProd ? 'info' : 'debug';

// Logger class
class Logger {
  private component: string;
  
  constructor(component: string) {
    this.component = component;
  }
  
  // Format log message
  private formatMessage(level: LogLevel, message: string): string {
    const timestamp = new Date().toISOString();
    return \`[\${timestamp}] [\${level.toUpperCase()}] [\${this.component}] \${message}\`;
  }
  
  // Check if level should be logged
  private shouldLog(level: LogLevel): boolean {
    return logLevels[level] >= logLevels[minLevel];
  }
  
  // Log methods
  debug(message: string, ...args: any[]): void {
    if (this.shouldLog('debug')) {
      console.debug(this.formatMessage('debug', message), ...args);
    }
  }
  
  info(message: string, ...args: any[]): void {
    if (this.shouldLog('info')) {
      console.info(this.formatMessage('info', message), ...args);
    }
  }
  
  warn(message: string, ...args: any[]): void {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message), ...args);
    }
  }
  
  error(message: string, error?: any, ...args: any[]): void {
    if (this.shouldLog('error')) {
      console.error(this.formatMessage('error', message), error, ...args);
    }
  }
}

// Create global logger
export const createLogger = (component: string): Logger => {
  return new Logger(component);
};

export default {
  createLogger,
};
`;
  }

  /**
   * Generate auth context
   */
  private generateAuthContext(authentication: any): string {
    const isOAuth = authentication.type?.toLowerCase().includes('oauth');
    const isJWT = authentication.type?.toLowerCase().includes('jwt');
    
    return `
import React, { createContext, useState, useEffect, useContext } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
${isOAuth ? "import { authorize, refresh, revoke } from 'react-native-app-auth';" : ''}
import { authService } from '../services/authService';
import { AppError } from '../utils/error';
import { createLogger } from '../utils/logger';

const logger = createLogger('AuthContext');

// User type
export interface User {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  role?: string;
}

// Authentication context
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  ${isOAuth ? 'loginWithOAuth: () => Promise<void>;' : ''}
  register: (userData: {
    name: string;
    email: string;
    password: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUser: (userData: Partial<User>) => Promise<void>;
  clearError: () => void;
}

// Create context
const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  login: async () => {},
  ${isOAuth ? 'loginWithOAuth: async () => {},' : ''}
  register: async () => {},
  logout: async () => {},
  resetPassword: async () => {},
  updateUser: async () => {},
  clearError: () => {},
});

// Storage keys
const USER_STORAGE_KEY = 'user';
const TOKEN_STORAGE_KEY = 'auth_token';
${isOAuth ? "const REFRESH_TOKEN_STORAGE_KEY = 'refresh_token';" : ''}

// Auth provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Initialize authentication state
  useEffect(() => {
    const initAuth = async () => {
      try {
        setIsLoading(true);
        
        // Check for stored user
        const storedUser = await AsyncStorage.getItem(USER_STORAGE_KEY);
        const token = await AsyncStorage.getItem(TOKEN_STORAGE_KEY);
        
        if (storedUser && token) {
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        logger.error('Error initializing auth', error);
        setError('Failed to restore authentication state');
      } finally {
        setIsLoading(false);
      }
    };
    
    initAuth();
  }, []);
  
  // Login with email and password
  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Call auth service
      const response = await authService.login(email, password);
      
      // Save user and token
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(response.user));
      await AsyncStorage.setItem(TOKEN_STORAGE_KEY, response.token);
      ${isOAuth ? "await AsyncStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, response.refreshToken);" : ''}
      
      setUser(response.user);
    } catch (error) {
      logger.error('Login error', error);
      if (error instanceof AppError) {
        setError(error.message);
      } else {
        setError('Failed to login. Please check your credentials and try again.');
      }
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  
  ${isOAuth ? `
  // Login with OAuth
  const loginWithOAuth = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // OAuth configuration
      const config = {
        issuer: 'https://your-oauth-issuer.com',
        clientId: 'YOUR_CLIENT_ID',
        redirectUrl: 'com.yourapp://callback',
        scopes: ['openid', 'profile', 'email'],
      };
      
      // Authorize
      const result = await authorize(config);
      
      // Exchange token for user info
      const userInfo = await authService.getUserInfo(result.accessToken);
      
      // Save tokens and user info
      await AsyncStorage.setItem(TOKEN_STORAGE_KEY, result.accessToken);
      await AsyncStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, result.refreshToken);
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userInfo));
      
      setUser(userInfo);
    } catch (error) {
      logger.error('OAuth login error', error);
      setError('Failed to login with OAuth');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  ` : ''}
  
  // Register new user
  const register = async (userData: {
    name: string;
    email: string;
    password: string;
  }) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Call auth service
      const response = await authService.register(userData);
      
      // Save user and token
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(response.user));
      await AsyncStorage.setItem(TOKEN_STORAGE_KEY, response.token);
      ${isOAuth ? "await AsyncStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, response.refreshToken);" : ''}
      
      setUser(response.user);
    } catch (error) {
      logger.error('Registration error', error);
      if (error instanceof AppError) {
        setError(error.message);
      } else {
        setError('Failed to register. Please try again later.');
      }
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Logout
  const logout = async () => {
    try {
      setIsLoading(true);
      
      // Call auth service
      await authService.logout();
      
      // Clear local storage
      await AsyncStorage.removeItem(USER_STORAGE_KEY);
      await AsyncStorage.removeItem(TOKEN_STORAGE_KEY);
      ${isOAuth ? "await AsyncStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);" : ''}
      
      setUser(null);
    } catch (error) {
      logger.error('Logout error', error);
      
      // Still remove local data even if API call fails
      await AsyncStorage.removeItem(USER_STORAGE_KEY);
      await AsyncStorage.removeItem(TOKEN_STORAGE_KEY);
      ${isOAuth ? "await AsyncStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);" : ''}
      
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Reset password
  const resetPassword = async (email: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Call auth service
      await authService.resetPassword(email);
      
      // Show success message
      Alert.alert(
        'Password Reset',
        'If an account exists with this email, you will receive password reset instructions.'
      );
    } catch (error) {
      logger.error('Password reset error', error);
      
      // Don't show specific error to prevent email enumeration
      Alert.alert(
        'Password Reset',
        'If an account exists with this email, you will receive password reset instructions.'
      );
    } finally {
      setIsLoading(false);
    }
  };
  
  // Update user
  const updateUser = async (userData: Partial<User>) => {
    try {
      setIsLoading(true);
      setError(null);
      
      if (!user) {
        throw new Error('User is not authenticated');
      }
      
      // Call auth service
      const updatedUser = await authService.updateUser(userData);
      
      // Update local storage
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));
      
      setUser(updatedUser);
    } catch (error) {
      logger.error('Update user error', error);
      if (error instanceof AppError) {
        setError(error.message);
      } else {
        setError('Failed to update user information');
      }
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Clear error
  const clearError = () => {
    setError(null);
  };
  
  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        error,
        login,
        ${isOAuth ? 'loginWithOAuth,' : ''}
        register,
        logout,
        resetPassword,
        updateUser,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Hook to use auth context
export const useAuth = () => useContext(AuthContext);

export default AuthContext;
`;
  }

  /**
   * Generate app context
   */
  private generateAppContext(appSpec: any): string {
    return `
import React, { createContext, useState, useContext, useEffect } from 'react';
import { MMKV } from 'react-native-mmkv';
import { createLogger } from '../utils/logger';

const logger = createLogger('AppContext');

// Create storage
const storage = new MMKV();

// App settings type
interface AppSettings {
  notifications: boolean;
  analytics: boolean;
  language: string;
  fontSize: 'small' | 'medium' | 'large';
}

// Default settings
const defaultSettings: AppSettings = {
  notifications: true,
  analytics: true,
  language: 'en',
  fontSize: 'medium',
};

// App context type
interface AppContextType {
  isFirstLaunch: boolean;
  isLoading: boolean;
  settings: AppSettings;
  updateSettings: (settings: Partial<AppSettings>) => void;
  completeFirstLaunch: () => void;
}

// Create context
const AppContext = createContext<AppContextType>({
  isFirstLaunch: true,
  isLoading: true,
  settings: defaultSettings,
  updateSettings: () => {},
  completeFirstLaunch: () => {},
});

// Storage keys
const SETTINGS_STORAGE_KEY = 'app_settings';
const FIRST_LAUNCH_STORAGE_KEY = 'first_launch';

// App provider component
export const AppProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isFirstLaunch, setIsFirstLaunch] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  
  // Initialize app state
  useEffect(() => {
    const initApp = async () => {
      try {
        setIsLoading(true);
        
        // Check for first launch
        const firstLaunchFlag = storage.getBoolean(FIRST_LAUNCH_STORAGE_KEY);
        setIsFirstLaunch(firstLaunchFlag !== false);
        
        // Load settings
        const storedSettings = storage.getString(SETTINGS_STORAGE_KEY);
        if (storedSettings) {
          setSettings(JSON.parse(storedSettings));
        } else {
          // Save default settings
          storage.set(SETTINGS_STORAGE_KEY, JSON.stringify(defaultSettings));
        }
      } catch (error) {
        logger.error('Error initializing app', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    initApp();
  }, []);
  
  // Update settings
  const updateSettings = (newSettings: Partial<AppSettings>) => {
    try {
      const updatedSettings = { ...settings, ...newSettings };
      setSettings(updatedSettings);
      storage.set(SETTINGS_STORAGE_KEY, JSON.stringify(updatedSettings));
    } catch (error) {
      logger.error('Error updating settings', error);
    }
  };
  
  // Complete first launch
  const completeFirstLaunch = () => {
    try {
      setIsFirstLaunch(false);
      storage.set(FIRST_LAUNCH_STORAGE_KEY, false);
    } catch (error) {
      logger.error('Error completing first launch', error);
    }
  };
  
  return (
    <AppContext.Provider
      value={{
        isFirstLaunch,
        isLoading,
        settings,
        updateSettings,
        completeFirstLaunch,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

// Hook to use app context
export const useApp = () => useContext(AppContext);

export default AppContext;
`;
  }

  /**
   * Generate cart context
   */
  private generateCartContext(): string {
    return `
import React, { createContext, useState, useContext, useEffect } from 'react';
import { MMKV } from 'react-native-mmkv';
import { createLogger } from '../utils/logger';

const logger = createLogger('CartContext');

// Create storage
const storage = new MMKV();

// Product type
export interface Product {
  id: string;
  name: string;
  price: number;
  image?: string;
  description?: string;
}

// Cart item type
export interface CartItem {
  product: Product;
  quantity: number;
}

// Cart context type
interface CartContextType {
  items: CartItem[];
  itemCount: number;
  total: number;
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
}

// Create context
const CartContext = createContext<CartContextType>({
  items: [],
  itemCount: 0,
  total: 0,
  addItem: () => {},
  removeItem: () => {},
  updateQuantity: () => {},
  clearCart: () => {},
});

// Storage key
const CART_STORAGE_KEY = 'cart_items';

// Cart provider component
export const CartProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [items, setItems] = useState<CartItem[]>([]);
  
  // Initialize cart from storage
  useEffect(() => {
    const initCart = () => {
      try {
        const storedCart = storage.getString(CART_STORAGE_KEY);
        if (storedCart) {
          setItems(JSON.parse(storedCart));
        }
      } catch (error) {
        logger.error('Error loading cart', error);
      }
    };
    
    initCart();
  }, []);
  
  // Save cart to storage
  useEffect(() => {
    const saveCart = () => {
      try {
        storage.set(CART_STORAGE_KEY, JSON.stringify(items));
      } catch (error) {
        logger.error('Error saving cart', error);
      }
    };
    
    saveCart();
  }, [items]);
  
  // Calculate total item count
  const itemCount = items.reduce((count, item) => count + item.quantity, 0);
  
  // Calculate total price
  const total = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );
  
  // Add item to cart
  const addItem = (product: Product, quantity = 1) => {
    setItems((prevItems) => {
      // Check if item already exists
      const existingItem = prevItems.find(
        (item) => item.product.id === product.id
      );
      
      if (existingItem) {
        // Update quantity of existing item
        return prevItems.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        // Add new item
        return [...prevItems, { product, quantity }];
      }
    });
  };
  
  // Remove item from cart
  const removeItem = (productId: string) => {
    setItems((prevItems) =>
      prevItems.filter((item) => item.product.id !== productId)
    );
  };
  
  // Update item quantity
  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }
    
    setItems((prevItems) =>
      prevItems.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };
  
  // Clear cart
  const clearCart = () => {
    setItems([]);
  };
  
  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        total,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

// Hook to use cart context
export const useCart = () => useContext(CartContext);

export default CartContext;
`;
  }

  /**
   * Generate useForm hook
   */
  private generateUseFormHook(): string {
    return `
import { useState, useCallback } from 'react';

interface FormErrors {
  [key: string]: string;
}

interface UseFormResult<T> {
  values: T;
  errors: FormErrors;
  touched: Record<keyof T, boolean>;
  isValid: boolean;
  isSubmitting: boolean;
  handleChange: (field: keyof T) => (value: any) => void;
  handleBlur: (field: keyof T) => () => void;
  handleSubmit: () => void;
  setFieldValue: (field: keyof T, value: any) => void;
  setFieldError: (field: keyof T, error: string) => void;
  resetForm: () => void;
}

type Validator<T> = (values: T) => FormErrors;

const useForm = <T extends Record<string, any>>(
  initialValues: T,
  validate: Validator<T>,
  onSubmit: (values: T) => Promise<void> | void
): UseFormResult<T> => {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<keyof T, boolean>>(() => {
    const touchedFields: Record<string, boolean> = {};
    Object.keys(initialValues).forEach((key) => {
      touchedFields[key] = false;
    });
    return touchedFields as Record<keyof T, boolean>;
  });
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  
  // Validate form
  const validateForm = useCallback(() => {
    const validationErrors = validate(values);
    setErrors(validationErrors);
    return Object.keys(validationErrors).length === 0;
  }, [values, validate]);
  
  // Handle field change
  const handleChange = useCallback(
    (field: keyof T) => (value: any) => {
      setValues((prevValues) => ({
        ...prevValues,
        [field]: value,
      }));
      
      // Clear error when field changes
      if (errors[field as string]) {
        setErrors((prevErrors) => {
          const newErrors = { ...prevErrors };
          delete newErrors[field as string];
          return newErrors;
        });
      }
    },
    [errors]
  );
  
  // Handle field blur
  const handleBlur = useCallback(
    (field: keyof T) => () => {
      setTouched((prevTouched) => ({
        ...prevTouched,
        [field]: true,
      }));
      
      // Validate field on blur
      const fieldErrors = validate({
        ...values,
      });
      
      if (fieldErrors[field as string]) {
        setErrors((prevErrors) => ({
          ...prevErrors,
          [field]: fieldErrors[field as string],
        }));
      }
    },
    [values, validate]
  );
  
  // Set field value directly
  const setFieldValue = useCallback(
    (field: keyof T, value: any) => {
      setValues((prevValues) => ({
        ...prevValues,
        [field]: value,
      }));
    },
    []
  );
  
  // Set field error directly
  const setFieldError = useCallback(
    (field: keyof T, error: string) => {
      setErrors((prevErrors) => ({
        ...prevErrors,
        [field]: error,
      }));
    },
    []
  );
  
  // Handle form submission
  const handleSubmit = useCallback(async () => {
    // Mark all fields as touched
    const allTouched: Record<string, boolean> = {};
    Object.keys(values).forEach((key) => {
      allTouched[key] = true;
    });
    setTouched(allTouched as Record<keyof T, boolean>);
    
    // Validate form
    const isValid = validateForm();
    
    if (isValid) {
      setIsSubmitting(true);
      try {
        await onSubmit(values);
      } catch (error) {
        // Handle submission error
        console.error('Form submission error:', error);
      } finally {
        setIsSubmitting(false);
      }
    }
  }, [values, validateForm, onSubmit]);
  
  // Reset form to initial values
  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched(() => {
      const touchedFields: Record<string, boolean> = {};
      Object.keys(initialValues).forEach((key) => {
        touchedFields[key] = false;
      });
      return touchedFields as Record<keyof T, boolean>;
    });
  }, [initialValues]);
  
  // Determine if form is valid
  const isValid = Object.keys(errors).length === 0;
  
  return {
    values,
    errors,
    touched,
    isValid,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    setFieldValue,
    setFieldError,
    resetForm,
  };
};

export default useForm;
`;
  }

  /**
   * Generate useApi hook
   */
  private generateUseApiHook(): string {
    return `
import { useState, useCallback, useEffect } from 'react';
import { AppError } from '../utils/error';

interface UseApiOptions<T> {
  initialData?: T;
  onSuccess?: (data: T) => void;
  onError?: (error: AppError) => void;
  autoFetch?: boolean;
}

interface UseApiResult<T> {
  data: T | null;
  isLoading: boolean;
  error: AppError | null;
  fetch: (...args: any[]) => Promise<T>;
  reset: () => void;
}

function useApi<T>(
  apiFunction: (...args: any[]) => Promise<T>,
  options: UseApiOptions<T> = {}
): UseApiResult<T> {
  const {
    initialData = null,
    onSuccess,
    onError,
    autoFetch = false,
  } = options;

  const [data, setData] = useState<T | null>(initialData);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<AppError | null>(null);

  const fetch = useCallback(
    async (...args: any[]) => {
      try {
        setIsLoading(true);
        setError(null);

        const result = await apiFunction(...args);
        setData(result);

        if (onSuccess) {
          onSuccess(result);
        }

        return result;
      } catch (err) {
        const appError = err instanceof AppError ? err : new AppError(
          err?.message || 'An unknown error occurred',
          'API_ERROR'
        );

        setError(appError);

        if (onError) {
          onError(appError);
        }

        throw appError;
      } finally {
        setIsLoading(false);
      }
    },
    [apiFunction, onSuccess, onError]
  );

  const reset = useCallback(() => {
    setData(initialData);
    setError(null);
  }, [initialData]);

  // Auto fetch on mount if enabled
  useEffect(() => {
    if (autoFetch) {
      fetch();
    }
  }, [autoFetch, fetch]);

  return { data, isLoading, error, fetch, reset };
}

export default useApi;
`;