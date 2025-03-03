import { Logger } from '../../server/utils/logger';

export class DatabaseSchemaParser {
  private logger: Logger;
  
  constructor() {
    this.logger = new Logger('DatabaseSchemaParser');
  }
  
  /**
   * Parse database schema
   */
  parse(dbSchema: any): any {
    try {
      // Validate and transform database schema if needed
      this.validate(dbSchema);
      
      // Return the parsed database schema
      return dbSchema;
    } catch (error) {
      this.logger.error('Error parsing database schema', error);
      throw error;
    }
  }
  
  /**
   * Validate database schema
   */
  private validate(dbSchema: any): void {
    // Basic validation
    if (!dbSchema) {
      throw new Error('Database schema is required');
    }
    
    if (!dbSchema.databaseType) {
      throw new Error('Database type is required');
    }
    
    if (!dbSchema.tables || !Array.isArray(dbSchema.tables) || dbSchema.tables.length === 0) {
      throw new Error('Database schema must have at least one table');
    }
  }
}

export default DatabaseSchemaParser;
