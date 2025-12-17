/**
 * API request/response type definitions
 * 
 * Defines contracts for all API endpoints.
 * These types are used by both client (hooks) and server (routes).
 */

import type { DocumentMetadata, PdfGenerationOptions, SignatureData } from './document'

// =============================================================================
// Common Types
// =============================================================================

/**
 * Standard API error response
 */
export interface ApiError {
    /** Error code for programmatic handling */
    code: string
    /** Human-readable error message */
    message: string
    /** Additional error details (validation errors, etc.) */
    details?: Record<string, unknown>
}

/**
 * Generic API response wrapper
 */
export type ApiResponse<T> =
    | { success: true; data: T }
    | { success: false; error: ApiError }

// =============================================================================
// Convert Endpoint (/api/convert)
// =============================================================================

/**
 * Request for DOCX to HTML conversion
 * Note: Actual request is multipart/form-data, this represents the parsed form
 */
export interface ConvertRequest {
    /** The uploaded DOCX file */
    file: File
}

/**
 * Response from DOCX to HTML conversion
 */
export interface ConvertResponse {
    /** Parsed HTML content */
    html: string
    /** Document metadata */
    metadata: DocumentMetadata
    /** Parsing warnings */
    warnings: string[]
}

// =============================================================================
// PDF Generation Endpoint (/api/pdf)
// =============================================================================

/**
 * Request for HTML to PDF generation
 */
export interface GeneratePdfRequest {
    /** HTML content to convert */
    html: string
    /** Optional generation options */
    options?: PdfGenerationOptions
}

/**
 * Response from PDF generation
 * Note: Actual response is binary PDF with application/pdf content-type
 */
export interface GeneratePdfResponse {
    /** PDF as base64-encoded string (for JSON responses) */
    pdfBase64: string
    /** PDF size in bytes */
    sizeBytes: number
}

// =============================================================================
// Sign Endpoint (/api/sign)
// =============================================================================

/**
 * Request for signature embedding
 */
export interface SignPdfRequest {
    /** Source PDF as base64-encoded string */
    pdfBase64: string
    /** Signatures to embed */
    signatures: SignatureData[]
}

/**
 * Response from signature embedding
 * Note: Actual response is binary PDF with application/pdf content-type
 */
export interface SignPdfResponse {
    /** Signed PDF as base64-encoded string (for JSON responses) */
    signedPdfBase64: string
    /** Signed PDF size in bytes */
    sizeBytes: number
}

// =============================================================================
// Error Codes
// =============================================================================

/**
 * Known API error codes
 */
export const API_ERROR_CODES = {
    // Validation errors
    INVALID_FILE_TYPE: 'INVALID_FILE_TYPE',
    FILE_TOO_LARGE: 'FILE_TOO_LARGE',
    INVALID_HTML: 'INVALID_HTML',
    INVALID_SIGNATURE: 'INVALID_SIGNATURE',

    // Processing errors
    PARSE_FAILED: 'PARSE_FAILED',
    PDF_GENERATION_FAILED: 'PDF_GENERATION_FAILED',
    SIGNATURE_EMBED_FAILED: 'SIGNATURE_EMBED_FAILED',

    // Server errors
    INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const

export type ApiErrorCode = typeof API_ERROR_CODES[keyof typeof API_ERROR_CODES]
