import { Logger } from '../../server/utils/logger';

export class AppSpecParser {
  private logger: Logger;
  
  constructor() {
    this.logger = new Logger('AppSpecParser');
  }
  
  /**
   * Parse app specification
   */
  parse(appSpec: any): any {
    try {
      // Validate and transform app specification if needed
      this.validate(appSpec);
      
      // Return the parsed specification
      return appSpec;
    } catch (error) {
      this.logger.error('Error parsing app specification', error);
      throw error;
    }
  }
  
  /**
   * Validate app specification
   */
  private validate(appSpec: any): void {
    // Basic validation
    if (!appSpec) {
      throw new Error('App specification is required');
    }
    
    if (!appSpec.appName) {
      throw new Error('App name is required');
    }
    
    if (!appSpec.appType) {
      throw new Error('App type is required');
    }
    
    if (!appSpec.screens || !Array.isArray(appSpec.screens) || appSpec.screens.length === 0) {
      throw new Error('App must have at least one screen');
    }
  }
}

export default AppSpecParser;
