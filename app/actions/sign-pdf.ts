'use server'

/**
 * Sign PDF Server Action
 * 
 * Server action for embedding signatures into PDFs.
 * Delegates to the PDF signer service and handles storage.
 */

import { getPdfSigner, type PageOverlays } from '@/lib/services'
import { readFile, saveFile } from '@/lib/storage'
import { handleActionError } from '@/lib/errors'
import type { SignatureData } from '@/lib/types'

// =============================================================================
// Types
// =============================================================================

interface SignPdfResult {
    success: boolean
    id?: string
    error?: string
}

// =============================================================================
// Server Action
// =============================================================================

/**
 * Sign a PDF and save the result to storage
 * 
 * @param pdfId - ID of the source PDF in storage
 * @param signatures - Positioned signature placements
 * @param overlays - Full-page overlay images (page number -> base64 PNG)
 * @returns Result with signed file ID or error
 */
export async function signPdfAction(
    pdfId: string,
    signatures: SignatureData[] = [],
    overlays: PageOverlays = {}
): Promise<SignPdfResult> {
    try {
        // Read source PDF from storage
        const pdfBytes = await readFile(pdfId)

        // Sign the PDF using the service
        const signer = getPdfSigner()
        const result = await signer.sign(pdfBytes, signatures, overlays)

        if (!result.success) {
            return {
                success: false,
                error: result.error,
            }
        }

        // Save signed PDF to storage
        const id = await saveFile(result.pdfBuffer)

        return {
            success: true,
            id,
        }
    } catch (error) {
        return handleActionError(error)
    }
}
