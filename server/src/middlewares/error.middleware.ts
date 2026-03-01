import { NextFunction, Request, Response } from 'express';
import { env } from '../config/env.config';
import { AppError, ErrorResponse, InternalServerError } from '../types/error.types';

export const errorHandler = (
    err: Error | AppError,
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    const timestamp = new Date().toISOString();
    const path = req.path;
    const method = req.method;

    // Default error response
    let statusCode = 500;
    let message = 'Internal server error';
    let details: Record<string, any> | undefined;

    // Handle custom AppError
    if (err instanceof AppError) {
        statusCode = err.statusCode;
        message = err.message;
        details = err.details;
    }
    else {
        err = new InternalServerError('An unexpected error occurred', { "originalError": err.message });
        message = err.message;
        details = err.stack ? { stack: err.stack } : undefined;
    }

    const errorResponse: ErrorResponse = {
        success: false,
        message,
        statusCode,
        timestamp,
    };

    // Include path and details only in development
    if (env.NODE_ENV === 'development') {
        errorResponse.path = path;
        if (details) {
            errorResponse.details = details;
        }
    }

    // Log error details
    logError({
        method,
        path,
        statusCode,
        message,
        error: err,
        timestamp,
    });

    res.status(statusCode).json(errorResponse);
};

export const notFoundHandler = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    const errorResponse: ErrorResponse = {
        success: false,
        message: `Route ${req.originalUrl} not found`,
        statusCode: 404,
        timestamp: new Date().toISOString(),
        path: req.path,
    };

    res.status(404).json(errorResponse);
};

export const asyncHandler = (fn: Function) => {
    return (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

interface ErrorLog {
    method: string;
    path: string;
    statusCode: number;
    message: string;
    error: Error;
    timestamp: string;
}

function logError(log: ErrorLog): void {
    const logLevel = log.statusCode >= 500 ? 'error' : 'warn';
    const logMessage = `[${log.timestamp}] ${logLevel.toUpperCase()} | ${log.method} ${log.path} | ${log.statusCode} | ${log.message}`;

    if (logLevel === 'error') {
        console.error(logMessage);
        if (env.NODE_ENV === 'development') {
            console.error('Stack trace:', log.error.stack);
        }
    } else {
        console.warn(logMessage);
    }
}
