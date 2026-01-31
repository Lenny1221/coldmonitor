type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  data?: any;
  error?: Error;
}

class Logger {
  private formatMessage(entry: LogEntry): string {
    const { level, message, timestamp, data, error } = entry;
    let logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
    
    if (data) {
      logMessage += ` | Data: ${JSON.stringify(data)}`;
    }
    
    if (error) {
      logMessage += ` | Error: ${error.message}`;
      if (error.stack) {
        logMessage += ` | Stack: ${error.stack}`;
      }
    }
    
    return logMessage;
  }

  private log(level: LogLevel, message: string, data?: any, error?: Error) {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      data,
      error,
    };

    const formatted = this.formatMessage(entry);

    switch (level) {
      case 'error':
        console.error(formatted);
        break;
      case 'warn':
        console.warn(formatted);
        break;
      case 'debug':
        if (process.env.NODE_ENV === 'development') {
          console.debug(formatted);
        }
        break;
      default:
        console.log(formatted);
    }
  }

  info(message: string, data?: any) {
    this.log('info', message, data);
  }

  warn(message: string, data?: any) {
    this.log('warn', message, data);
  }

  error(message: string, error?: Error, data?: any) {
    this.log('error', message, data, error);
  }

  debug(message: string, data?: any) {
    this.log('debug', message, data);
  }
}

export const logger = new Logger();
