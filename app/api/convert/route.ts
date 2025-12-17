/**
 * DOCX to HTML Conversion API Route
 * 
 * POST /api/convert
 * 
 * Server-side DOCX parsing with validation and sanitization.
 * Returns semantic HTML as the single source of truth.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createDocumentParser, MAX_FILE_SIZE } from '@/lib/services/document-parser'
import type { ApiError, ConvertResponse } from '@/lib/types'

// =============================================================================
// Configuration
// =============================================================================

/**
 * Disable body parsing - we handle multipart/form-data manually
 */
export const config = {
    api: {
        bodyParser: false,
    },
}

// =============================================================================
// Types
// =============================================================================

interface ErrorResponse {
    error: ApiError
}

// =============================================================================
// Handlers
// =============================================================================

/**
 * Handle DOCX to HTML conversion
 */
export async function POST(request: NextRequest): Promise<NextResponse<ConvertResponse | ErrorResponse>> {
    const parser = createDocumentParser()

    try {
        // Parse multipart form data
        const formData = await request.formData()
        const file = formData.get('file')

        // Validate file exists
        if (!file || !(file instanceof File)) {
            return NextResponse.json(
                {
                    error: {
                        code: 'INVALID_FILE_TYPE',
                        message: 'No file provided. Please upload a .docx file.',
                    },
                },
                { status: 400 }
            )
        }

        // Validate file properties
        const validationError = parser.validateFile({
            name: file.name,
            size: file.size,
            type: file.type || undefined,
        })

        if (validationError) {
            return NextResponse.json(
                { error: validationError },
                { status: 400 }
            )
        }

        // Read file content
        let arrayBuffer: ArrayBuffer
        try {
            arrayBuffer = await file.arrayBuffer()
        } catch {
            return NextResponse.json(
                {
                    error: {
                        code: 'PARSE_FAILED',
                        message: 'Failed to read file content',
                    },
                },
                { status: 400 }
            )
        }

        // Validate content size (double-check after reading)
        if (arrayBuffer.byteLength > MAX_FILE_SIZE) {
            return NextResponse.json(
                {
                    error: {
                        code: 'FILE_TOO_LARGE',
                        message: `File size must be less than ${MAX_FILE_SIZE / 1024 / 1024}MB`,
                    },
                },
                { status: 413 }
            )
        }

        // Validate DOCX magic bytes (PK signature for ZIP format)
        const header = new Uint8Array(arrayBuffer.slice(0, 4))
        if (header[0] !== 0x50 || header[1] !== 0x4B) {
            return NextResponse.json(
                {
                    error: {
                        code: 'INVALID_FILE_TYPE',
                        message: 'File does not appear to be a valid DOCX document',
                    },
                },
                { status: 400 }
            )
        }

        // Parse DOCX to sanitized HTML
        const result = await parser.parseDocx(arrayBuffer, file.name)

        if (!result.success) {
            return NextResponse.json(
                { error: result.error },
                { status: 422 }
            )
        }

        // Return successful response
        const response: ConvertResponse = {
            html: result.data.html,
            metadata: {
                ...result.data.metadata,
                uploadedAt: result.data.metadata.uploadedAt,
            },
            warnings: result.data.warnings,
        }

        return NextResponse.json(response, { status: 200 })
    } catch (error) {
        console.error('Convert API error:', error)

        // Handle specific error types
        if (error instanceof Error && error.message.includes('Body exceeded')) {
            return NextResponse.json(
                {
                    error: {
                        code: 'FILE_TOO_LARGE',
                        message: 'Request body too large',
                    },
                },
                { status: 413 }
            )
        }

        return NextResponse.json(
            {
                error: {
                    code: 'INTERNAL_ERROR',
                    message: 'An unexpected error occurred while processing the document',
                },
            },
            { status: 500 }
        )
    }
}

/**
 * Method not allowed handler
 */
export async function GET(): Promise<NextResponse<ErrorResponse>> {
    return NextResponse.json(
        { error: { code: 'METHOD_NOT_ALLOWED', message: 'Use POST method with multipart/form-data' } },
        { status: 405 }
    )
}

/**
 * OPTIONS handler for CORS preflight
 */
export async function OPTIONS(): Promise<NextResponse> {
    return new NextResponse(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        },
    })
}
