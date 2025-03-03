export class Logger {
  private component: string;
  
  constructor(component: string) {
    this.component = component;
  }
  
  info(message: string, ...args: any[]): void {
    console.info(`[INFO] [${this.component}] ${message}`, ...args);
  }
  
  error(message: string, error?: any, ...args: any[]): void {
    console.error(`[ERROR] [${this.component}] ${message}`, error, ...args);
  }
  
  warn(message: string, ...args: any[]): void {
    console.warn(`[WARN] [${this.component}] ${message}`, ...args);
  }
  
  debug(message: string, ...args: any[]): void {
    console.debug(`[DEBUG] [${this.component}] ${message}`, ...args);
  }
}

export const createLogger = (component: string): Logger => {
  return new Logger(component);
};

export default Logger;
