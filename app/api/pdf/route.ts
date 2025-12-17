/**
 * HTML to PDF Generation API Route
 * 
 * POST /api/pdf
 * 
 * Accepts HTML content and returns generated PDF.
 * Currently returns 501 as PDF generation requires browser APIs.
 */

import { NextRequest, NextResponse } from 'next/server'
import { generatePdfRequestSchema } from '@/lib/schemas'
import type { ApiError, GeneratePdfResponse } from '@/lib/types'

/**
 * Handle HTML to PDF generation
 */
export async function POST(request: NextRequest): Promise<NextResponse<GeneratePdfResponse | { error: ApiError }>> {
    try {
        const body = await request.json()

        // Validate request
        const validation = generatePdfRequestSchema.safeParse(body)
        if (!validation.success) {
            return NextResponse.json(
                {
                    error: {
                        code: 'INVALID_HTML',
                        message: validation.error.errors[0]?.message || 'Invalid request',
                        details: { errors: validation.error.errors },
                    },
                },
                { status: 400 }
            )
        }

        // NOTE: Server-side PDF generation would require:
        // - Puppeteer or Playwright for headless browser rendering
        // - Or a library like Pdfkit for programmatic PDF creation

        // For now, we delegate to client-side processing
        // which uses jsPDF + html2canvas

        return NextResponse.json(
            {
                error: {
                    code: 'INTERNAL_ERROR',
                    message: 'Server-side PDF generation not yet implemented. Use client-side service.',
                },
            },
            { status: 501 }
        )
    } catch (error) {
        console.error('PDF API error:', error)
        return NextResponse.json(
            {
                error: {
                    code: 'INTERNAL_ERROR',
                    message: error instanceof Error ? error.message : 'An unexpected error occurred',
                },
            },
            { status: 500 }
        )
    }
}

/**
 * Method not allowed handler
 */
export async function GET(): Promise<NextResponse> {
    return NextResponse.json(
        { error: { code: 'METHOD_NOT_ALLOWED', message: 'Use POST method' } },
        { status: 405 }
    )
}
