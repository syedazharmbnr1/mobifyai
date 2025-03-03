export interface PlatformAdapter {
  // Get information about the platform
  getPlatformName(): string;
  
  // Get directory paths
  getComponentsDir(): string;
  getScreensDir(): string;
  getModelsDir(): string;
  getServicesDir(): string;
  getNavigationDir(): string;
  getThemeDir(): string;
  getUtilsDir(): string;
  getAssetsDir(): string;
  getContextsDir(): string;
  getHooksDir(): string;
  
  // Get file names
  getComponentFileName(componentName: string): string;
  getScreenFileName(screenName: string): string;
  getModelFileName(modelName: string): string;
  getAPIServiceFileName(): string;
  getDomainServiceFileName(domain: string): string;
  
  // Database schema support
  supportsDatabaseSchema(): boolean;
  getDatabaseSchemaPath(): string;
  
  // Project structure
  createProjectStructure(projectDir: string, appSpec: any): Promise<void>;
  
  // Generate base files
  generateBaseFiles(projectDir: string, appSpec: any): Promise<void>;
  
  // Generate navigation
  generateNavigation(projectDir: string, appSpec: any): Promise<void>;
  
  // Generate data model
  generateModel(modelName: string, model: any): string;
  
  // Generate database schema
  generateDatabaseSchema(dbSchema: any): string;
  
  // Generate API services
  generateAPIService(endpoints: any[]): string;
  generateDomainService(domain: string, endpoints: any[]): string;
  
  // Generate authentication
  generateAuthentication(projectDir: string, authentication: any): Promise<void>;
  
  // Generate database integration
  generateDatabaseIntegration(projectDir: string, dbSchema: any): Promise<void>;
  
  // Generate tests
  generateTests(projectDir: string, appSpec: any): Promise<void>;
  
  // Generate basic components when AI generation fails
  generateBasicComponent(componentName: string, uiDesign: any): string;
  
  // Generate basic screen when AI generation fails
  generateBasicScreen(screenName: string, screen: any, uiDesign: any): string;
}

export default PlatformAdapter;
