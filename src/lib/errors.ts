/**
 * Error handling utilities
 */
import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { ERROR_MESSAGES } from './constants';

export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public userMessage?: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

/**
 * Logs error details server-side (could be extended to use a logging service)
 */
export function logError(error: unknown, context?: string): void {
  const timestamp = new Date().toISOString();
  const contextStr = context ? `[${context}]` : '';

  if (error instanceof Error) {
    console.error(`${timestamp} ${contextStr} ${error.name}: ${error.message}`);
    if (error.stack) {
      console.error(error.stack);
    }
  } else {
    console.error(`${timestamp} ${contextStr} Unknown error:`, error);
  }
}

/**
 * Creates a safe error response for the client
 * Logs full details server-side, returns sanitized message to client
 */
export function createErrorResponse(error: unknown, context?: string): NextResponse {
  logError(error, context);

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    const issues = error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join(', ');
    return NextResponse.json(
      {
        error: 'Dados inválidos',
        details: issues,
      },
      { status: 400 }
    );
  }

  // Handle custom app errors
  if (error instanceof AppError) {
    return NextResponse.json(
      { error: error.userMessage || error.message },
      { status: error.statusCode }
    );
  }

  // Handle generic errors - don't expose details
  if (error instanceof Error) {
    // Check for specific error patterns
    if (error.message.includes('fetch') || error.message.includes('network')) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.NETWORK_ERROR },
        { status: 503 }
      );
    }
  }

  // Default error response
  return NextResponse.json(
    { error: 'Não foi possível completar a ação. Tente novamente em alguns minutos.' },
    { status: 500 }
  );
}

/**
 * Validates that required environment variables are present
 */
export function requireEnvVar(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new AppError(
      `Missing environment variable: ${name}`,
      500,
      ERROR_MESSAGES.API_KEY_MISSING
    );
  }
  return value;
}
