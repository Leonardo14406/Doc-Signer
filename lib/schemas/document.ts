/**
 * Document validation schemas
 * 
 * Zod schemas for runtime validation of document-related data.
 */

import { z } from 'zod'

// =============================================================================
// File Upload Validation
// =============================================================================

/**
 * Maximum file size: 10MB
 */
export const MAX_FILE_SIZE = 10 * 1024 * 1024

/**
 * Allowed file extensions
 */
export const ALLOWED_EXTENSIONS = ['.docx'] as const

/**
 * Allowed MIME types
 */
export const ALLOWED_MIME_TYPES = [
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
] as const

/**
 * Schema for validating file uploads
 */
export const fileUploadSchema = z.object({
    name: z.string().refine(
        (name) => ALLOWED_EXTENSIONS.some(ext => name.toLowerCase().endsWith(ext)),
        { message: 'File must be a .docx file' }
    ),
    size: z.number().max(MAX_FILE_SIZE, {
        message: `File must be less than ${MAX_FILE_SIZE / 1024 / 1024}MB`,
    }),
    type: z.enum(ALLOWED_MIME_TYPES as unknown as [string, ...string[]], {
        errorMap: () => ({ message: 'Invalid file type. Please upload a .docx file.' }),
    }).optional(), // Made optional since some browsers may not report MIME type
})

/**
 * Type inferred from file upload schema
 */
export type FileUploadInput = z.infer<typeof fileUploadSchema>

// =============================================================================
// Document Content Validation
// =============================================================================

/**
 * Schema for validating HTML content
 */
export const htmlContentSchema = z.string()
    .min(1, 'HTML content cannot be empty')
    .max(10 * 1024 * 1024, 'HTML content too large') // 10MB max

/**
 * Schema for document metadata
 */
export const documentMetadataSchema = z.object({
    filename: z.string().min(1),
    sizeBytes: z.number().int().positive(),
    mimeType: z.string(),
    uploadedAt: z.date(),
})

/**
 * Schema for parsed document content
 */
export const documentContentSchema = z.object({
    html: htmlContentSchema,
    metadata: documentMetadataSchema,
    warnings: z.array(z.string()),
})

// =============================================================================
// Signature Validation
// =============================================================================

/**
 * Schema for signature position
 */
export const signaturePositionSchema = z.object({
    page: z.number().int().positive(),
    x: z.number().min(0),
    y: z.number().min(0),
    width: z.number().positive(),
    height: z.number().positive(),
})

/**
 * Base64 image pattern (PNG format)
 */
const BASE64_PNG_PATTERN = /^data:image\/png;base64,[A-Za-z0-9+/=]+$/

/**
 * Schema for signature data
 */
export const signatureDataSchema = z.object({
    imageBase64: z.string().regex(BASE64_PNG_PATTERN, {
        message: 'Signature must be a valid base64-encoded PNG image',
    }),
    position: signaturePositionSchema,
    createdAt: z.number().int().positive(),
})

/**
 * Schema for array of signatures
 */
export const signaturesArraySchema = z.array(signatureDataSchema).min(1, {
    message: 'At least one signature is required',
})

// =============================================================================
// PDF Options Validation
// =============================================================================

/**
 * Schema for PDF generation options
 */
export const pdfOptionsSchema = z.object({
    format: z.enum(['a4', 'letter', 'legal']).default('a4'),
    orientation: z.enum(['portrait', 'landscape']).default('portrait'),
    margins: z.object({
        top: z.number().min(0).default(20),
        right: z.number().min(0).default(20),
        bottom: z.number().min(0).default(20),
        left: z.number().min(0).default(20),
    }).optional(),
}).optional()

// =============================================================================
// Validation Helpers
// =============================================================================

/**
 * Validate a file for upload
 */
export function validateFileUpload(file: File): z.SafeParseReturnType<FileUploadInput, FileUploadInput> {
    return fileUploadSchema.safeParse({
        name: file.name,
        size: file.size,
        type: file.type || undefined,
    })
}

/**
 * Validate HTML content
 */
export function validateHtmlContent(html: string): z.SafeParseReturnType<string, string> {
    return htmlContentSchema.safeParse(html)
}

/**
 * Validate signature data array
 */
export function validateSignatures(signatures: unknown): z.SafeParseReturnType<unknown, z.infer<typeof signaturesArraySchema>> {
    return signaturesArraySchema.safeParse(signatures)
}
