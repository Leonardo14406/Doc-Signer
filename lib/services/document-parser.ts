/**
 * Document Parser Service
 * 
 * Handles DOCX to semantic HTML conversion with proper sanitization.
 * Uses mammoth for conversion and isomorphic-dompurify for sanitization.
 */

import type { DocumentContent, ParseOptions, DocumentMetadata } from '@/lib/types'
import { sanitizeHtml } from '@/lib/sanitization'

// =============================================================================
// Configuration
// =============================================================================

/**
 * Maximum file size: 10MB
 */
export const MAX_FILE_SIZE = 10 * 1024 * 1024

/**
 * Allowed MIME types for DOCX files
 */
export const ALLOWED_MIME_TYPES = [
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
] as const

/**
 * Mammoth style map for semantic HTML conversion
 * Maps Word styles to semantic HTML elements
 */
const SEMANTIC_STYLE_MAP = [
    // Headings
    "p[style-name='Heading 1'] => h1:fresh",
    "p[style-name='Heading 2'] => h2:fresh",
    "p[style-name='Heading 3'] => h3:fresh",
    "p[style-name='Heading 4'] => h4:fresh",
    "p[style-name='Heading 5'] => h5:fresh",
    "p[style-name='Heading 6'] => h6:fresh",

    // Lists - map to semantic list elements
    "p[style-name='List Paragraph'] => li:fresh",

    // Tables are handled automatically by mammoth

    // Ignore Word-specific styling that doesn't map cleanly to HTML
    "p[style-name='Normal'] => p:fresh",

    // Bold, italic, underline are handled automatically
    "b => strong",
    "i => em",
    "u => u",

    // Page breaks - mark with semantic class
    "br[type='page'] => hr.page-break:fresh",
] as const
// =============================================================================
// Result Types
// =============================================================================

/**
 * Parse error types
 */
export type ParseErrorCode =
    | 'INVALID_FILE_TYPE'
    | 'FILE_TOO_LARGE'
    | 'EMPTY_FILE'
    | 'PARSE_FAILED'
    | 'SANITIZATION_FAILED'
    | 'UNKNOWN_ERROR'

/**
 * Parse error
 */
export interface ParseError {
    code: ParseErrorCode
    message: string
    cause?: unknown
}

/**
 * Result type for parser operations
 */
export type ParseResult =
    | { success: true; data: DocumentContent }
    | { success: false; error: ParseError }

// =============================================================================
// Service Interface
// =============================================================================

/**
 * Document parser service interface
 */
export interface DocumentParserService {
    /**
     * Validate a file before parsing
     */
    validateFile(file: { name: string; size: number; type?: string }): ParseError | null

    /**
     * Parse a DOCX file and convert to semantic HTML
     */
    parseDocx(
        file: ArrayBuffer,
        filename: string,
        options?: ParseOptions
    ): Promise<ParseResult>

    /**
     * Sanitize HTML content
     */
    sanitizeHtml(html: string): string
}

// =============================================================================
// Implementation
// =============================================================================

/**
 * Create a document parser service
 */
export function createDocumentParser(): DocumentParserService {
    return {
        validateFile(file): ParseError | null {
            // Check file extension
            if (!file.name.toLowerCase().endsWith('.docx')) {
                return {
                    code: 'INVALID_FILE_TYPE',
                    message: 'Only .docx files are supported',
                }
            }

            // Check file size
            if (file.size > MAX_FILE_SIZE) {
                return {
                    code: 'FILE_TOO_LARGE',
                    message: `File size must be less than ${MAX_FILE_SIZE / 1024 / 1024}MB`,
                }
            }

            // Check for empty file
            if (file.size === 0) {
                return {
                    code: 'EMPTY_FILE',
                    message: 'File is empty',
                }
            }

            // Check MIME type if available
            if (file.type && !ALLOWED_MIME_TYPES.includes(file.type as typeof ALLOWED_MIME_TYPES[number])) {
                return {
                    code: 'INVALID_FILE_TYPE',
                    message: 'Invalid file type. Please upload a .docx file.',
                }
            }

            return null
        },

        sanitizeHtml(html: string): string {
            return sanitizeHtml(html, {
                onSanitization: (msg) => console.warn(`[DocumentParser] ${msg}`)
            })
        },

        async parseDocx(file, filename, options = {}): Promise<ParseResult> {
            try {
                // Validate file size
                if (file.byteLength > MAX_FILE_SIZE) {
                    return {
                        success: false,
                        error: {
                            code: 'FILE_TOO_LARGE',
                            message: `File size must be less than ${MAX_FILE_SIZE / 1024 / 1024}MB`,
                        },
                    }
                }

                if (file.byteLength === 0) {
                    return {
                        success: false,
                        error: {
                            code: 'EMPTY_FILE',
                            message: 'File is empty',
                        },
                    }
                }

                // Dynamic import for code splitting
                const mammoth = await import('mammoth')

                // Build style map
                const styleMap = [
                    ...SEMANTIC_STYLE_MAP,
                    ...(options.styleMap ?? []),
                ]

                // Convert DOCX to HTML
                const result = await mammoth.convertToHtml(
                    { arrayBuffer: file },
                    {
                        styleMap,
                        // Convert images to inline base64
                        convertImage: mammoth.images.inline((element) => {
                            return element.read('base64').then((imageBuffer) => {
                                const contentType = element.contentType || 'image/png'
                                return {
                                    src: `data:${contentType};base64,${imageBuffer}`,
                                }
                            })
                        }),
                    }
                )

                // Check if conversion produced any content
                if (!result.value || result.value.trim().length === 0) {
                    return {
                        success: false,
                        error: {
                            code: 'PARSE_FAILED',
                            message: 'Document appears to be empty or could not be parsed',
                        },
                    }
                }

                // Sanitize the HTML immediately
                const sanitizedHtml = this.sanitizeHtml(result.value)

                // Build metadata
                const metadata: DocumentMetadata = {
                    filename,
                    sizeBytes: file.byteLength,
                    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                    uploadedAt: new Date(),
                }

                // Collect warnings
                const warnings = result.messages
                    .filter((m) => m.type === 'warning')
                    .map((m) => m.message)

                const documentContent: DocumentContent = {
                    html: sanitizedHtml,
                    metadata,
                    warnings,
                }

                return { success: true, data: documentContent }
            } catch (error) {
                // Handle specific mammoth errors
                if (error instanceof Error) {
                    if (error.message.includes('Could not find file')) {
                        return {
                            success: false,
                            error: {
                                code: 'PARSE_FAILED',
                                message: 'Invalid DOCX file: file structure is corrupted',
                                cause: error,
                            },
                        }
                    }
                    if (error.message.includes('End of data reached')) {
                        return {
                            success: false,
                            error: {
                                code: 'PARSE_FAILED',
                                message: 'Invalid DOCX file: file is truncated or corrupted',
                                cause: error,
                            },
                        }
                    }
                }

                return {
                    success: false,
                    error: {
                        code: 'PARSE_FAILED',
                        message: error instanceof Error ? error.message : 'Failed to parse document',
                        cause: error,
                    },
                }
            }
        },
    }
}

// =============================================================================
// Singleton Instance
// =============================================================================

let _instance: DocumentParserService | null = null

/**
 * Get the document parser service instance
 */
export function getDocumentParser(): DocumentParserService {
    if (!_instance) {
        _instance = createDocumentParser()
    }
    return _instance
}
