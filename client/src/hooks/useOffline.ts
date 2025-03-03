// hooksDir/useOffline.ts

import { useState, useEffect, useCallback } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { MMKV } from 'react-native-mmkv';
import { v4 as uuidv4 } from 'uuid';
import { createLogger } from '../utils/logger';

const logger = createLogger('useOffline');

// Create storage for offline queue
const storage = new MMKV();
const OFFLINE_QUEUE_KEY = 'offline_queue';

// Types for offline operations
export interface OfflineOperation {
  id: string;
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  data?: any;
  createdAt: number;
}

interface OfflineQueueItem {
  operation: OfflineOperation;
  retryCount: number;
  lastRetry?: number;
}

interface UseOfflineResult {
  isOnline: boolean;
  isOfflineSupported: boolean;
  offlineQueueSize: number;
  enqueueOperation: (operation: Omit<OfflineOperation, 'id' | 'createdAt'>) => string;
  syncOfflineQueue: () => Promise<void>;
  clearOfflineQueue: () => void;
}

const useOffline = (apiService: any): UseOfflineResult => {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [offlineQueue, setOfflineQueue] = useState<OfflineQueueItem[]>([]);
  
  // Set network status when connectivity changes
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      const online = state.isConnected && state.isInternetReachable;
      setIsOnline(!!online);
      
      // Try to sync queue when coming back online
      if (online && offlineQueue.length > 0) {
        syncOfflineQueue();
      }
    });
    
    // Load offline queue from storage
    const loadOfflineQueue = () => {
      try {
        const storedQueue = storage.getString(OFFLINE_QUEUE_KEY);
        if (storedQueue) {
          setOfflineQueue(JSON.parse(storedQueue));
        }
      } catch (error) {
        logger.error('Error loading offline queue', error);
      }
    };
    
    loadOfflineQueue();
    
    return () => {
      unsubscribe();
    };
  }, []);
  
  // Save offline queue to storage whenever it changes
  useEffect(() => {
    const saveOfflineQueue = () => {
      try {
        storage.set(OFFLINE_QUEUE_KEY, JSON.stringify(offlineQueue));
      } catch (error) {
        logger.error('Error saving offline queue', error);
      }
    };
    
    saveOfflineQueue();
  }, [offlineQueue]);
  
  // Add an operation to the offline queue
  const enqueueOperation = useCallback(
    (operation: Omit<OfflineOperation, 'id' | 'createdAt'>): string => {
      // Generate ID for the operation
      const id = uuidv4();
      
      // Create complete operation with ID and timestamp
      const completeOperation: OfflineOperation = {
        ...operation,
        id,
        createdAt: Date.now(),
      };
      
      // Add to queue
      setOfflineQueue((prevQueue) => [
        ...prevQueue,
        { operation: completeOperation, retryCount: 0 },
      ]);
      
      logger.info(`Added operation to offline queue: ${operation.method} ${operation.endpoint}`);
      
      return id;
    },
    []
  );
  
  // Try to process all operations in the offline queue
  const syncOfflineQueue = useCallback(async () => {
    if (!isOnline || offlineQueue.length === 0) {
      return;
    }
    
    logger.info(`Attempting to sync ${offlineQueue.length} offline operations`);
    
    // Process queue in order (oldest first)
    const sortedQueue = [...offlineQueue].sort(
      (a, b) => a.operation.createdAt - b.operation.createdAt
    );
    
    // Max retries and backoff time (in ms)
    const MAX_RETRIES = 5;
    const RETRY_BACKOFF = 2000;
    
    for (const item of sortedQueue) {
      const { operation, retryCount } = item;
      
      // Skip operations that have been retried too many times
      if (retryCount >= MAX_RETRIES) {
        logger.warn(`Skipping operation that exceeded max retries: ${operation.id}`);
        continue;
      }
      
      // Skip operations that were retried recently
      const lastRetry = item.lastRetry || 0;
      const backoffTime = RETRY_BACKOFF * Math.pow(2, retryCount);
      if (lastRetry && Date.now() - lastRetry < backoffTime) {
        continue;
      }
      
      try {
        // Execute the operation
        const { endpoint, method, data } = operation;
        
        if (method === 'GET') {
          await apiService.get(endpoint);
        } else if (method === 'POST') {
          await apiService.post(endpoint, data);
        } else if (method === 'PUT') {
          await apiService.put(endpoint, data);
        } else if (method === 'PATCH') {
          await apiService.patch(endpoint, data);
        } else if (method === 'DELETE') {
          await apiService.delete(endpoint);
        }
        
        // Remove successful operation from queue
        setOfflineQueue((prevQueue) =>
          prevQueue.filter((q) => q.operation.id !== operation.id)
        );
        
        logger.info(`Successfully synced operation: ${operation.id}`);
      } catch (error) {
        logger.error(`Failed to sync operation: ${operation.id}`, error);
        
        // Update retry count
        setOfflineQueue((prevQueue) =>
          prevQueue.map((q) =>
            q.operation.id === operation.id
              ? {
                  ...q,
                  retryCount: q.retryCount + 1,
                  lastRetry: Date.now(),
                }
              : q
          )
        );
      }
    }
  }, [isOnline, offlineQueue, apiService]);
  
  // Clear the offline queue
  const clearOfflineQueue = useCallback(() => {
    setOfflineQueue([]);
  }, []);
  
  return {
    isOnline,
    isOfflineSupported: true,
    offlineQueueSize: offlineQueue.length,
    enqueueOperation,
    syncOfflineQueue,
    clearOfflineQueue,
  };
};

export default useOffline;