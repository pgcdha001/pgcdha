/**
 * Logger Utility
 * Centralized logging with environment-aware output
 */

class Logger {
  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
    this.isProduction = process.env.NODE_ENV === 'production';
  }

  // Development-only logging
  dev(...args) {
    if (this.isDevelopment) {
      console.log('🔧 [DEV]', ...args);
    }
  }

  // Information logging
  info(...args) {
    console.log('ℹ️ [INFO]', ...args);
  }

  // Warning logging
  warn(...args) {
    console.warn('⚠️ [WARN]', ...args);
  }

  // Error logging
  error(...args) {
    console.error('❌ [ERROR]', ...args);
  }

  // Success logging
  success(...args) {
    console.log('✅ [SUCCESS]', ...args);
  }

  // Database logging
  db(...args) {
    if (this.isDevelopment) {
      console.log('📦 [DB]', ...args);
    }
  }

  // API logging
  api(...args) {
    if (this.isDevelopment) {
      console.log('🌐 [API]', ...args);
    }
  }

  // Authentication logging
  auth(...args) {
    if (this.isDevelopment) {
      console.log('🔐 [AUTH]', ...args);
    }
  }
}

module.exports = new Logger();
