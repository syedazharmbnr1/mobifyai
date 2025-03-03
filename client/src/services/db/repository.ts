// services/db/repository.ts

import { v4 as uuidv4 } from 'uuid';
import DatabaseAdapter, { QueryParams } from './adapters';
import { createLogger } from '../../utils/logger';

const logger = createLogger('DatabaseRepository');

// Base repository interface
export interface Repository<T> {
  findAll(): Promise<T[]>;
  findById(id: string): Promise<T | null>;
  findOne(whereClause: string, whereParams?: QueryParams): Promise<T | null>;
  find(whereClause: string, whereParams?: QueryParams): Promise<T[]>;
  create(data: Omit<T, 'id'>): Promise<T>;
  update(id: string, data: Partial<T>): Promise<boolean>;
  delete(id: string): Promise<boolean>;
  count(whereClause?: string, whereParams?: QueryParams): Promise<number>;
}

// Base repository implementation
export abstract class BaseRepository<T extends { id: string }> implements Repository<T> {
  protected tableName: string;
  protected primaryKey: string;
  
  constructor(tableName: string, primaryKey: string = 'id') {
    this.tableName = tableName;
    this.primaryKey = primaryKey;
  }
  
  /**
   * Find all records
   */
  async findAll(): Promise<T[]> {
    try {
      return await DatabaseAdapter.query(this.tableName);
    } catch (error) {
      logger.error(`Error finding all ${this.tableName}`, error);
      throw error;
    }
  }
  
  /**
   * Find record by ID
   */
  async findById(id: string): Promise<T | null> {
    try {
      return await DatabaseAdapter.getById(this.tableName, id);
    } catch (error) {
      logger.error(`Error finding ${this.tableName} by ID`, error);
      throw error;
    }
  }
  
  /**
   * Find one record by custom where clause
   */
  async findOne(whereClause: string, whereParams: QueryParams = []): Promise<T | null> {
    try {
      const results = await DatabaseAdapter.query(
        this.tableName,
        ['*'],
        whereClause,
        whereParams,
        undefined,
        1
      );
      
      return results.length > 0 ? results[0] : null;
    } catch (error) {
      logger.error(`Error finding one ${this.tableName}`, error);
      throw error;
    }
  }
  
  /**
   * Find records by custom where clause
   */
  async find(whereClause: string, whereParams: QueryParams = []): Promise<T[]> {
    try {
      return await DatabaseAdapter.query(
        this.tableName,
        ['*'],
        whereClause,
        whereParams
      );
    } catch (error) {
      logger.error(`Error finding ${this.tableName}`, error);
      throw error;
    }
  }
  
  /**
   * Create a new record
   */
  async create(data: Omit<T, 'id'>): Promise<T> {
    try {
      // Generate ID if not provided
      const recordWithId = {
        ...data,
        id: uuidv4(),
      };
      
      // Add timestamps if not provided
      if (!('createdAt' in recordWithId)) {
        (recordWithId as any).createdAt = new Date().toISOString();
      }
      
      if (!('updatedAt' in recordWithId)) {
        (recordWithId as any).updatedAt = new Date().toISOString();
      }
      
      await DatabaseAdapter.insert(this.tableName, recordWithId);
      
      return recordWithId as T;
    } catch (error) {
      logger.error(`Error creating ${this.tableName}`, error);
      throw error;
    }
  }
  
  /**
   * Update a record
   */
  async update(id: string, data: Partial<T>): Promise<boolean> {
    try {
      // Add updated timestamp
      const dataWithTimestamp = {
        ...data,
        updatedAt: new Date().toISOString(),
      };
      
      const rowsAffected = await DatabaseAdapter.update(
        this.tableName,
        dataWithTimestamp,
        `${this.primaryKey} = ?`,
        [id]
      );
      
      return rowsAffected > 0;
    } catch (error) {
      logger.error(`Error updating ${this.tableName}`, error);
      throw error;
    }
  }
  
  /**
   * Delete a record
   */
  async delete(id: string): Promise<boolean> {
    try {
      const rowsAffected = await DatabaseAdapter.delete(
        this.tableName,
        `${this.primaryKey} = ?`,
        [id]
      );
      
      return rowsAffected > 0;
    } catch (error) {
      logger.error(`Error deleting ${this.tableName}`, error);
      throw error;
    }
  }
  
  /**
   * Count records
   */
  async count(whereClause?: string, whereParams: QueryParams = []): Promise<number> {
    try {
      return await DatabaseAdapter.count(this.tableName, whereClause, whereParams);
    } catch (error) {
      logger.error(`Error counting ${this.tableName}`, error);
      throw error;
    }
  }
  
  /**
   * Find with pagination
   */
  async findWithPagination(
    page: number = 1,
    limit: number = 20,
    whereClause?: string,
    whereParams: QueryParams = [],
    orderBy?: string
  ): Promise<{ data: T[]; total: number; page: number; pageSize: number; pageCount: number }> {
    try {
      // Calculate offset
      const offset = (page - 1) * limit;
      
      // Get total count
      const total = await this.count(whereClause, whereParams);
      
      // Get paginated data
      const data = await DatabaseAdapter.query(
        this.tableName,
        ['*'],
        whereClause,
        whereParams,
        orderBy,
        limit,
        offset
      );
      
      // Calculate page count
      const pageCount = Math.ceil(total / limit);
      
      return {
        data,
        total,
        page,
        pageSize: limit,
        pageCount,
      };
    } catch (error) {
      logger.error(`Error finding ${this.tableName} with pagination`, error);
      throw error;
    }
  }
  
  /**
   * Perform a custom query
   */
  async customQuery(
    query: string,
    params: QueryParams = []
  ): Promise<any[]> {
    try {
      return await DatabaseAdapter.executeQuery(query, params);
    } catch (error) {
      logger.error(`Error executing custom query on ${this.tableName}`, error);
      throw error;
    }
  }
}

// Example user repository implementation
export class UserRepository extends BaseRepository<{
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  role?: string;
  createdAt: string;
  updatedAt: string;
}> {
  constructor() {
    super('users');
  }
  
  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<{
    id: string;
    email: string;
    name?: string;
    avatar?: string;
    role?: string;
    createdAt: string;
    updatedAt: string;
  } | null> {
    return this.findOne('email = ?', [email]);
  }
  
  /**
   * Find users by role
   */
  async findByRole(role: string): Promise<{
    id: string;
    email: string;
    name?: string;
    avatar?: string;
    role?: string;
    createdAt: string;
    updatedAt: string;
  }[]> {
    return this.find('role = ?', [role]);
  }
}

// Create repositories for different entities
export const userRepository = new UserRepository();

// Factory function to create repositories dynamically
export function createRepository<T extends { id: string }>(
  tableName: string,
  primaryKey: string = 'id'
): Repository<T> {
  return new BaseRepository<T>(tableName, primaryKey) as Repository<T>;
}

export default {
  BaseRepository,
  UserRepository,
  userRepository,
  createRepository,
};