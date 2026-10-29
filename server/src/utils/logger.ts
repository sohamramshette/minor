type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';

function formatMessage(level: LogLevel, message: string): string {
  const timestamp = new Date().toISOString();
  return `[${timestamp}] [${level}] ${message}`;
}

export const logger = {
  info: (msg: string, ...args: unknown[]) => {
    console.log(formatMessage('INFO', msg), ...args);
  },
  warn: (msg: string, ...args: unknown[]) => {
    console.warn(formatMessage('WARN', msg), ...args);
  },
  error: (msg: string, ...args: unknown[]) => {
    console.error(formatMessage('ERROR', msg), ...args);
  },
  debug: (msg: string, ...args: unknown[]) => {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(formatMessage('DEBUG', msg), ...args);
    }
  },
};
