// preview-service/renderers/previewRenderer.ts

export interface PreviewOptions {
    projectId: string;
    previewId: string;
    previewDir: string;
    appSpec: any;
    uiDesignSystem: any;
  }
  
  export interface PreviewResult {
    entryFile: string;
    assets: string[];
    screens: string[];
  }
  
  export abstract class PreviewRenderer {
    /**
     * Generate preview files for a mobile app
     */
    abstract generatePreview(options: PreviewOptions): Promise<PreviewResult>;
    
    /**
     * Generate component code for a specific platform
     */
    abstract generateComponent(componentType: string, props: any, theme: any): string;
    
    /**
     * Generate screen code for a specific platform
     */
    abstract generateScreen(screen: any, components: any[], theme: any): string;
    
    /**
     * Generate navigation code for a specific platform
     */
    abstract generateNavigation(screens: any[], theme: any): string;
    
    /**
     * Generate theme code for a specific platform
     */
    abstract generateTheme(designSystem: any): string;
    
    /**
     * Generate mock data for a specific platform
     */
    abstract generateMockData(dataModels: any[]): string;
  }