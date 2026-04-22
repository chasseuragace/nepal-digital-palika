/**
 * Custom Error Types for Datasource Operations
 * Provides specific error types for better error handling and debugging
 */

export class DatasourceError extends Error {
  constructor(message: string, public readonly code?: string, public readonly originalError?: any) {
    super(message)
    this.name = 'DatasourceError'
  }
}

export class NotFoundError extends DatasourceError {
  constructor(message: string = 'Resource not found', code?: string, originalError?: any) {
    super(message, code || 'NOT_FOUND', originalError)
    this.name = 'NotFoundError'
  }
}

export class ValidationError extends DatasourceError {
  constructor(message: string = 'Validation failed', code?: string, originalError?: any) {
    super(message, code || 'VALIDATION_ERROR', originalError)
    this.name = 'ValidationError'
  }
}

export class DatabaseError extends DatasourceError {
  constructor(message: string = 'Database operation failed', code?: string, originalError?: any) {
    super(message, code || 'DATABASE_ERROR', originalError)
    this.name = 'DatabaseError'
  }
}

export class ConfigurationError extends DatasourceError {
  constructor(message: string = 'Configuration error', code?: string, originalError?: any) {
    super(message, code || 'CONFIGURATION_ERROR', originalError)
    this.name = 'ConfigurationError'
  }
}
