/**
 * Application Error Types
 * 
 * Standardized error classes for predictable error handling.
 */

export class AppError extends Error {
    public readonly statusCode: number
    public readonly code: string

    constructor(message: string, statusCode: number = 500, code: string = 'INTERNAL_ERROR') {
        super(message)
        this.name = 'AppError'
        this.statusCode = statusCode
        this.code = code
    }

    public toJSON() {
        return {
            error: {
                message: this.message,
                code: this.code,
            }
        }
    }
}

export class NotFoundError extends AppError {
    constructor(resource: string) {
        super(`${resource} not found`, 404, 'NOT_FOUND')
    }
}

export class ValidationError extends AppError {
    constructor(message: string) {
        super(message, 400, 'VALIDATION_ERROR')
    }
}

export function handleActionError(error: unknown) {
    if (error instanceof AppError) {
        console.error(`[${error.code}] ${error.message}`)
        return {
            success: false,
            error: error.message,
        }
    }

    console.error('[UNEXPECTED_ERROR]', error)
    return {
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
    }
}
