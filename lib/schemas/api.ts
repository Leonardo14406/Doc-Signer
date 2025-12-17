/**
 * API payload validation schemas
 * 
 * Zod schemas for validating API request bodies.
 */

import { z } from 'zod'
import { htmlContentSchema, pdfOptionsSchema, signaturesArraySchema } from './document'

// =============================================================================
// Convert Endpoint Schemas
// =============================================================================

/**
 * Schema for convert request (parsed from multipart/form-data)
 * Note: File validation is handled separately by fileUploadSchema
 */
export const convertRequestSchema = z.object({
    // File is validated separately
})

/**
 * Schema for convert response
 */
export const convertResponseSchema = z.object({
    html: htmlContentSchema,
    metadata: z.object({
        filename: z.string(),
        sizeBytes: z.number(),
        mimeType: z.string(),
        uploadedAt: z.string().datetime(),
    }),
    warnings: z.array(z.string()),
})

// =============================================================================
// PDF Generation Endpoint Schemas
// =============================================================================

/**
 * Schema for PDF generation request
 */
export const generatePdfRequestSchema = z.object({
    html: htmlContentSchema,
    options: pdfOptionsSchema,
})

/**
 * Schema for PDF generation response (JSON variant)
 */
export const generatePdfResponseSchema = z.object({
    pdfBase64: z.string(),
    sizeBytes: z.number().int().positive(),
})

// =============================================================================
// Sign Endpoint Schemas
// =============================================================================

/**
 * Base64 PDF pattern
 */
const BASE64_PDF_PATTERN = /^[A-Za-z0-9+/=]+$/

/**
 * Schema for sign request
 */
export const signPdfRequestSchema = z.object({
    pdfBase64: z.string().regex(BASE64_PDF_PATTERN, {
        message: 'Invalid base64-encoded PDF',
    }),
    signatures: signaturesArraySchema,
})

/**
 * Schema for sign response (JSON variant)
 */
export const signPdfResponseSchema = z.object({
    signedPdfBase64: z.string(),
    sizeBytes: z.number().int().positive(),
})

// =============================================================================
// Error Response Schema
// =============================================================================

/**
 * Schema for API error responses
 */
export const apiErrorSchema = z.object({
    code: z.string(),
    message: z.string(),
    details: z.record(z.unknown()).optional(),
})

/**
 * Schema for generic API response wrapper
 */
export const apiResponseSchema = <T extends z.ZodType>(dataSchema: T) =>
    z.discriminatedUnion('success', [
        z.object({ success: z.literal(true), data: dataSchema }),
        z.object({ success: z.literal(false), error: apiErrorSchema }),
    ])
