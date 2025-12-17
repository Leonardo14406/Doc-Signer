/**
 * PDF Generation Hook
 * 
 * Handles HTML to PDF conversion using server-side Puppeteer.
 */

'use client'

import { useState, useCallback } from 'react'
import { generatePdfAction } from '@/app/actions/generate-pdf'
import type { PdfGenerationOptions } from '@/lib/types'

// =============================================================================
// Types
// =============================================================================

export interface UsePdfGenerationReturn {
    /** Generate PDF from HTML content */
    generate: (html: string, options?: PdfGenerationOptions) => Promise<string | null>
    /** Whether generation is in progress */
    isGenerating: boolean
    /** Error message if generation failed */
    error: string | null
    /** Clear error state */
    clearError: () => void
}

// =============================================================================
// Hook
// =============================================================================

/**
 * Hook for PDF generation
 */
export function usePdfGeneration(): UsePdfGenerationReturn {
    const [isGenerating, setIsGenerating] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const clearError = useCallback(() => {
        setError(null)
    }, [])

    const generate = useCallback(
        async (html: string, options?: PdfGenerationOptions): Promise<string | null> => {
            setError(null)
            setIsGenerating(true)

            try {
                const result = await generatePdfAction(html, options)

                if (!result.success || !result.id) {
                    throw new Error(result.error || 'Failed to generate PDF')
                }

                return result.id
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'Failed to generate PDF'
                setError(errorMessage)
                return null
            } finally {
                setIsGenerating(false)
            }
        },
        []
    )

    return {
        generate,
        isGenerating,
        error,
        clearError,
    }
}
