/**
 * Signature Hook
 * 
 * Handles signature drawing and PDF embedding.
 */

'use client'

import { useState, useCallback, useRef } from 'react'
import { signPdfAction } from '@/app/actions/sign-pdf'
import { SignatureData } from '@/lib/types'

// =============================================================================
// Types
// =============================================================================

export interface UseSignatureReturn {
    /** Map of page number to canvas element */
    canvasRefs: React.MutableRefObject<Map<number, HTMLCanvasElement>>
    /** Whether any signature has been drawn */
    hasSignature: boolean
    /** Set signature status */
    setHasSignature: (value: boolean) => void
    /** Clear all signature canvases */
    clearAll: () => void
    /** Embed signatures into PDF */
    embedSignatures: (pdfId: string) => Promise<string | null>
    /** Whether embedding is in progress */
    isEmbedding: boolean
    /** Error message if embedding failed */
    error: string | null
}

// =============================================================================
// Hook
// =============================================================================

/**
 * Hook for signature handling
 */
export function useSignature(): UseSignatureReturn {
    const canvasRefs = useRef<Map<number, HTMLCanvasElement>>(new Map())
    const [hasSignature, setHasSignature] = useState(false)
    const [isEmbedding, setIsEmbedding] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const clearAll = useCallback(() => {
        canvasRefs.current.forEach((canvas) => {
            const ctx = canvas.getContext('2d')
            if (ctx) {
                ctx.clearRect(0, 0, canvas.width, canvas.height)
            }
        })
        setHasSignature(false)
    }, [])

    const embedSignatures = useCallback(
        async (pdfId: string): Promise<string | null> => {
            setError(null)
            setIsEmbedding(true)

            try {
                // Collect canvas overlays for pages with drawings
                const overlays: Record<number, string> = {}

                for (const [pageNum, canvas] of canvasRefs.current) {
                    const ctx = canvas.getContext('2d')
                    if (!ctx) continue

                    // Check if canvas has any content
                    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
                    const hasInk = imageData.data.some((value, index) => index % 4 === 3 && value !== 0)

                    if (hasInk) {
                        overlays[pageNum] = canvas.toDataURL('image/png')
                    }
                }

                // If no drawings, we might still have placements (future).
                // But for now, if no overlays, validation check.
                // In future, we would pass `signatures` array here too.
                if (Object.keys(overlays).length === 0) {
                    setError('No signatures to embed')
                    return null
                }

                // Call Server Action
                // Pass empty array for explicit signatures for now, focusing on overrides
                const result = await signPdfAction(pdfId, [], overlays)

                if (!result.success || !result.id) {
                    throw new Error(result.error || 'Failed to embed signature')
                }

                return result.id
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'Failed to embed signature'
                setError(errorMessage)
                return null
            } finally {
                setIsEmbedding(false)
            }
        },
        []
    )

    return {
        canvasRefs,
        hasSignature,
        setHasSignature,
        clearAll,
        embedSignatures,
        isEmbedding,
        error,
    }
}
