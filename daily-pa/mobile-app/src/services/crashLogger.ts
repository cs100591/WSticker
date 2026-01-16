/**
 * Crash Logger Service
 * Logs crash details and stack traces for debugging
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const CRASH_LOG_KEY = '@crash_logs';
const MAX_CRASH_LOGS = 10;

export interface CrashLog {
  id: string;
  timestamp: number;
  error: {
    message: string;
    stack?: string;
    name: string;
  };
  deviceInfo: {
    platform: string;
    version: string;
  };
  appState: {
    route?: string;
    userId?: string;
  };
}

class CrashLogger {
  /**
   * Log a crash with error details
   */
  async logCrash(
    error: Error,
    appState?: { route?: string; userId?: string }
  ): Promise<void> {
    try {
      const crashLog: CrashLog = {
        id: `crash_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
        error: {
          message: error.message,
          stack: error.stack,
          name: error.name,
        },
        deviceInfo: {
          platform: Platform.OS,
          version: Platform.Version.toString(),
        },
        appState: appState || {},
      };

      // Get existing crash logs
      const existingLogs = await this.getCrashLogs();

      // Add new log and keep only the most recent MAX_CRASH_LOGS
      const updatedLogs = [crashLog, ...existingLogs].slice(0, MAX_CRASH_LOGS);

      // Save to storage
      await AsyncStorage.setItem(CRASH_LOG_KEY, JSON.stringify(updatedLogs));

      // Log to console in development
      if (__DEV__) {
        console.error('[CrashLogger] Crash logged:', crashLog);
      }
    } catch (storageError) {
      // If we can't save the crash log, at least log it to console
      console.error('[CrashLogger] Failed to save crash log:', storageError);
      console.error('[CrashLogger] Original error:', error);
    }
  }

  /**
   * Get all crash logs
   */
  async getCrashLogs(): Promise<CrashLog[]> {
    try {
      const logsJson = await AsyncStorage.getItem(CRASH_LOG_KEY);
      if (!logsJson) {
        return [];
      }
      return JSON.parse(logsJson);
    } catch (error) {
      console.error('[CrashLogger] Failed to retrieve crash logs:', error);
      return [];
    }
  }

  /**
   * Clear all crash logs
   */
  async clearCrashLogs(): Promise<void> {
    try {
      await AsyncStorage.removeItem(CRASH_LOG_KEY);
    } catch (error) {
      console.error('[CrashLogger] Failed to clear crash logs:', error);
    }
  }

  /**
   * Get crash logs as formatted string for reporting
   */
  async getCrashLogsFormatted(): Promise<string> {
    const logs = await this.getCrashLogs();
    
    if (logs.length === 0) {
      return 'No crash logs available';
    }

    return logs
      .map((log, index) => {
        const date = new Date(log.timestamp).toISOString();
        return `
=== Crash ${index + 1} ===
Date: ${date}
Platform: ${log.deviceInfo.platform} ${log.deviceInfo.version}
Error: ${log.error.name}: ${log.error.message}
Route: ${log.appState.route || 'Unknown'}
User ID: ${log.appState.userId || 'Not logged in'}

Stack Trace:
${log.error.stack || 'No stack trace available'}
`;
      })
      .join('\n\n');
  }

  /**
   * Get the most recent crash log
   */
  async getLastCrash(): Promise<CrashLog | null> {
    const logs = await this.getCrashLogs();
    return logs.length > 0 ? logs[0] : null;
  }
}

export const crashLogger = new CrashLogger();
