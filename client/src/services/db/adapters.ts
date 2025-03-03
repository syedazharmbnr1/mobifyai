// services/db/adapters.ts

import SQLite from 'react-native-sqlite-storage';
import { Platform } from 'react-native';
import { createLogger } from '../../utils/logger';

const logger = createLogger('DatabaseAdapter');

// Enable promises for SQLite
SQLite.enablePromise(true);

// Database schema definition
export interface DatabaseSchema {
  name: string;
  version: number;
  tables: DatabaseTable[];
}

// Table definition
export interface DatabaseTable {
  name: string;
  columns: DatabaseColumn[];
  primaryKey: string;
  indices?: DatabaseIndex[];
}

// Column definition
export interface DatabaseColumn {
  name: string;
  type: string;
  constraints: string[];
}

// Index definition
export interface DatabaseIndex {
  name: string;
  columns: string[];
  type: string;
}

// Query params type
export type QueryParams = (string | number | boolean | null)[];

// Generic database adapter class
export class DatabaseAdapter {
  private static instance: DatabaseAdapter;
  private database: SQLite.SQLiteDatabase | null = null;
  private initialized: boolean = false;
  private schema: DatabaseSchema | null = null;
  
  // Private constructor to prevent direct instantiation
  private constructor() {}
  
  // Get singleton instance
  public static getInstance(): DatabaseAdapter {
    if (!DatabaseAdapter.instance) {
      DatabaseAdapter.instance = new DatabaseAdapter();
    }
    return DatabaseAdapter.instance;
  }
  
  /**
   * Initialize the database
   */
  public async initialize(schema: DatabaseSchema): Promise<void> {
    if (this.initialized) {
      return;
    }
    
    try {
      logger.info(`Initializing database: ${schema.name}`);
      
      // Open database
      this.database = await SQLite.openDatabase({
        name: `${schema.name}.db`,
        location: 'default',
      });
      
      this.schema = schema;
      
      // Create tables if they don't exist
      await this.createTables();
      
      this.initialized = true;
      logger.info('Database initialized successfully');
    } catch (error) {
      logger.error('Error initializing database', error);
      throw error;
    }
  }
  
  /**
   * Close the database connection
   */
  public async close(): Promise<void> {
    if (!this.database) {
      return;
    }
    
    try {
      await this.database.close();
      this.database = null;
      this.initialized = false;
      logger.info('Database connection closed');
    } catch (error) {
      logger.error('Error closing database', error);
      throw error;
    }
  }
  
  /**
   * Execute a SQL query
   */
  public async executeQuery(
    query: string,
    params: QueryParams = []
  ): Promise<any[]> {
    this.ensureInitialized();
    
    try {
      logger.debug(`Executing query: ${query}`, params);
      const [result] = await this.database!.executeSql(query, params);
      
      // Convert result to array of objects
      const rows: any[] = [];
      for (let i = 0; i < result.rows.length; i++) {
        rows.push(result.rows.item(i));
      }
      
      return rows;
    } catch (error) {
      logger.error(`Error executing query: ${query}`, error);
      throw error;
    }
  }
  
  /**
   * Execute a SQL transaction with multiple queries
   */
  public async executeTransaction(
    queries: { query: string; params: QueryParams }[]
  ): Promise<void> {
    this.ensureInitialized();
    
    try {
      await this.database!.transaction((tx) => {
        queries.forEach(({ query, params }) => {
          logger.debug(`Transaction query: ${query}`, params);
          tx.executeSql(query, params);
        });
      });
    } catch (error) {
      logger.error('Error executing transaction', error);
      throw error;
    }
  }
  
  /**
   * Create tables based on schema
   */
  private async createTables(): Promise<void> {
    if (!this.schema) {
      throw new Error('Database schema not set');
    }
    
    try {
      // Begin transaction
      await this.database!.transaction((tx) => {
        // Create each table
        this.schema!.tables.forEach((table) => {
          // Build CREATE TABLE statement
          const createTableQuery = this.buildCreateTableQuery(table);
          logger.debug(`Creating table: ${createTableQuery}`);
          
          tx.executeSql(createTableQuery);
          
          // Create indices
          if (table.indices && table.indices.length > 0) {
            table.indices.forEach((index) => {
              const createIndexQuery = this.buildCreateIndexQuery(table.name, index);
              logger.debug(`Creating index: ${createIndexQuery}`);
              
              tx.executeSql(createIndexQuery);
            });
          }
        });
      });
      
      logger.info('Tables created successfully');
    } catch (error) {
      logger.error('Error creating tables', error);
      throw error;
    }
  }
  
  /**
   * Build CREATE TABLE query from table definition
   */
  private buildCreateTableQuery(table: DatabaseTable): string {
    // Start with table creation
    let query = `CREATE TABLE IF NOT EXISTS ${table.name} (`;
    
    // Add columns
    const columnDefinitions = table.columns.map((column) => {
      return `${column.name} ${column.type}${
        column.constraints && column.constraints.length > 0
          ? ' ' + column.constraints.join(' ')
          : ''
      }`;
    });
    
    query += columnDefinitions.join(', ');
    
    // Close the query
    query += ')';
    
    return query;
  }
  
  /**
   * Build CREATE INDEX query from index definition
   */
  private buildCreateIndexQuery(
    tableName: string,
    index: DatabaseIndex
  ): string {
    // Start with index creation
    let query = `CREATE ${
      index.type === 'UNIQUE' ? 'UNIQUE ' : ''
    }INDEX IF NOT EXISTS ${index.name} ON ${tableName} (`;
    
    // Add columns
    query += index.columns.join(', ');
    
    // Close the query
    query += ')';
    
    return query;
  }
  
  /**
   * Ensure database is initialized
   */
  private ensureInitialized(): void {
    if (!this.initialized || !this.database) {
      throw new Error('Database not initialized');
    }
  }
  
  /**
   * Insert data into a table
   */
  public async insert(
    tableName: string,
    data: Record<string, any>
  ): Promise<number> {
    this.ensureInitialized();
    
    try {
      // Build column names and placeholders
      const columns = Object.keys(data);
      const placeholders = columns.map(() => '?').join(', ');
      const values = columns.map((col) => data[col]);
      
      // Build INSERT query
      const query = `INSERT INTO ${tableName} (${columns.join(
        ', '
      )}) VALUES (${placeholders})`;
      
      logger.debug(`Inserting into ${tableName}:`, data);
      const [result] = await this.database!.executeSql(query, values);
      
      return result.insertId;
    } catch (error) {
      logger.error(`Error inserting into ${tableName}`, error);
      throw error;
    }
  }
  
  /**
   * Update data in a table
   */
  public async update(
    tableName: string,
    data: Record<string, any>,
    whereClause: string,
    whereParams: QueryParams = []
  ): Promise<number> {
    this.ensureInitialized();
    
    try {
      // Build SET clause
      const columns = Object.keys(data);
      const setClause = columns.map((col) => `${col} = ?`).join(', ');
      const values = columns.map((col) => data[col]);
      
      // Build UPDATE query
      const query = `UPDATE ${tableName} SET ${setClause} WHERE ${whereClause}`;
      
      logger.debug(`Updating ${tableName}:`, { data, whereClause, whereParams });
      const [result] = await this.database!.executeSql(
        query,
        [...values, ...whereParams]
      );
      
      return result.rowsAffected;
    } catch (error) {
      logger.error(`Error updating ${tableName}`, error);
      throw error;
    }
  }
  
  /**
   * Delete data from a table
   */
  public async delete(
    tableName: string,
    whereClause: string,
    whereParams: QueryParams = []
  ): Promise<number> {
    this.ensureInitialized();
    
    try {
      // Build DELETE query
      const query = `DELETE FROM ${tableName} WHERE ${whereClause}`;
      
      logger.debug(`Deleting from ${tableName}:`, { whereClause, whereParams });
      const [result] = await this.database!.executeSql(query, whereParams);
      
      return result.rowsAffected;
    } catch (error) {
      logger.error(`Error deleting from ${tableName}`, error);
      throw error;
    }
  }
  
  /**
   * Query data from a table
   */
  public async query(
    tableName: string,
    columns: string[] = ['*'],
    whereClause?: string,
    whereParams: QueryParams = [],
    orderBy?: string,
    limit?: number,
    offset?: number
  ): Promise<any[]> {
    this.ensureInitialized();
    
    try {
      // Build SELECT query
      let query = `SELECT ${columns.join(', ')} FROM ${tableName}`;
      
      if (whereClause) {
        query += ` WHERE ${whereClause}`;
      }
      
      if (orderBy) {
        query += ` ORDER BY ${orderBy}`;
      }
      
      if (limit) {
        query += ` LIMIT ${limit}`;
      }
      
      if (offset) {
        query += ` OFFSET ${offset}`;
      }
      
      logger.debug(`Querying ${tableName}:`, {
        columns,
        whereClause,
        whereParams,
        orderBy,
        limit,
        offset,
      });
      
      return await this.executeQuery(query, whereParams);
    } catch (error) {
      logger.error(`Error querying ${tableName}`, error);
      throw error;
    }
  }
  
  /**
   * Get a single row by ID
   */
  public async getById(
    tableName: string,
    id: string | number,
    columns: string[] = ['*']
  ): Promise<any | null> {
    this.ensureInitialized();
    
    try {
      // Find the primary key column
      const table = this.schema!.tables.find((t) => t.name === tableName);
      if (!table) {
        throw new Error(`Table ${tableName} not found in schema`);
      }
      
      const primaryKey = table.primaryKey || 'id';
      
      // Query the row
      const rows = await this.query(
        tableName,
        columns,
        `${primaryKey} = ?`,
        [id]
      );
      
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      logger.error(`Error getting ${tableName} by ID`, error);
      throw error;
    }
  }
  
  /**
   * Count rows in a table
   */
  public async count(
    tableName: string,
    whereClause?: string,
    whereParams: QueryParams = []
  ): Promise<number> {
    this.ensureInitialized();
    
    try {
      // Build COUNT query
      let query = `SELECT COUNT(*) as count FROM ${tableName}`;
      
      if (whereClause) {
        query += ` WHERE ${whereClause}`;
      }
      
      logger.debug(`Counting ${tableName}:`, { whereClause, whereParams });
      const rows = await this.executeQuery(query, whereParams);
      
      return rows[0].count;
    } catch (error) {
      logger.error(`Error counting ${tableName}`, error);
      throw error;
    }
  }
}

// Export singleton instance
export default DatabaseAdapter.getInstance();