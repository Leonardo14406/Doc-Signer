/**
 * Signature Embedding API Route
 * 
 * POST /api/sign
 * 
 * Accepts a PDF and signature data, returns signed PDF.
 */

import { NextRequest, NextResponse } from 'next/server'
import { signPdfRequestSchema } from '@/lib/schemas'
import type { ApiError, SignPdfResponse } from '@/lib/types'

/**
 * Handle signature embedding
 */
export async function POST(request: NextRequest): Promise<NextResponse<SignPdfResponse | { error: ApiError }>> {
    try {
        const body = await request.json()

        // Validate request
        const validation = signPdfRequestSchema.safeParse(body)
        if (!validation.success) {
            return NextResponse.json(
                {
                    error: {
                        code: 'INVALID_SIGNATURE',
                        message: validation.error.errors[0]?.message || 'Invalid request',
                        details: { errors: validation.error.errors },
                    },
                },
                { status: 400 }
            )
        }

        // NOTE: pdf-lib CAN run server-side in Node.js
        // This could be fully implemented here
        // For now, we delegate to client-side for consistency

        return NextResponse.json(
            {
                error: {
                    code: 'INTERNAL_ERROR',
                    message: 'Server-side signing not yet implemented. Use client-side service.',
                },
            },
            { status: 501 }
        )
    } catch (error) {
        console.error('Sign API error:', error)
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
