/**
 * PDF Signer Service
 * 
 * Handles signature embedding into PDFs using pdf-lib.
 * Pure business logic - no framework-specific code.
 */

import { PDFDocument } from 'pdf-lib'
// import { v4 as uuidv4 } from 'uuid'
import type { SignatureData } from '@/lib/types'

// =============================================================================
// Types
// =============================================================================

export interface PdfSignerResult {
    success: true
    pdfBuffer: Buffer
}

export interface PdfSignerError {
    success: false
    error: string
}

export type SignPdfResult = PdfSignerResult | PdfSignerError

/**
 * Full-page overlay data - drawings that cover an entire page
 */
export type PageOverlays = Record<number, string>

// =============================================================================
// Service Interface
// =============================================================================

export interface PdfSignerService {
    /**
     * Embed signatures and overlays into a PDF
     * 
     * @param pdfBytes - Source PDF as Buffer
     * @param signatures - Positioned signature placements
     * @param overlays - Full-page overlay images (key = page number, value = base64 PNG)
     */
    sign(
        pdfBytes: Buffer,
        signatures?: SignatureData[],
        overlays?: PageOverlays
    ): Promise<SignPdfResult>
}

// =============================================================================
// Implementation
// =============================================================================

/**
 * Create a PDF signer service instance
 */
export function createPdfSigner(): PdfSignerService {
    return {
        async sign(
            pdfBytes: Buffer,
            signatures: SignatureData[] = [],
            overlays: PageOverlays = {}
        ): Promise<SignPdfResult> {
            try {
                // Load the PDF document
                const pdfDoc = await PDFDocument.load(pdfBytes)
                const pages = pdfDoc.getPages()

                // 1. Process explicit signatures (placed at specific coordinates)
                for (const signature of signatures) {
                    const { position, imageBase64 } = signature
                    const pageIndex = position.page - 1 // 1-based to 0-based

                    if (pageIndex < 0 || pageIndex >= pages.length) {
                        console.warn(`Attempted to sign page ${position.page} which does not exist.`)
                        continue
                    }

                    const page = pages[pageIndex]

                    // Decode signature image
                    const base64Data = imageBase64.replace(/^data:image\/png;base64,/, '')
                    const imageBytes = Buffer.from(base64Data, 'base64')
                    const embeddedImage = await pdfDoc.embedPng(imageBytes)

                    // pdf-lib uses bottom-left origin
                    page.drawImage(embeddedImage, {
                        x: position.x,
                        y: position.y,
                        width: position.width,
                        height: position.height,
                    })
                }

                // 2. Process full-page overlays (freehand drawings)
                for (const [pageNumStr, imageBase64] of Object.entries(overlays)) {
                    const pageNum = parseInt(pageNumStr, 10)
                    const pageIndex = pageNum - 1

                    if (pageIndex < 0 || pageIndex >= pages.length) continue

                    const page = pages[pageIndex]
                    const { width, height } = page.getSize()

                    const base64Data = imageBase64.replace(/^data:image\/png;base64,/, '')
                    const imageBytes = Buffer.from(base64Data, 'base64')
                    const embeddedImage = await pdfDoc.embedPng(imageBytes)

                    page.drawImage(embeddedImage, {
                        x: 0,
                        y: 0,
                        width: width,
                        height: height,
                    })
                }

                // Add document metadata
                pdfDoc.setTitle('Signed Document')
                pdfDoc.setAuthor('SignFlow User')
                pdfDoc.setProducer('SignFlow PDF Signer')
                pdfDoc.setModificationDate(new Date())

                const signedPdfBytes = await pdfDoc.save()

                return {
                    success: true,
                    pdfBuffer: Buffer.from(signedPdfBytes),
                }
            } catch (error) {
                console.error('PDF Signing failed:', error)
                return {
                    success: false,
                    error: error instanceof Error ? error.message : 'Unknown error during signing',
                }
            }
        },
    }
}

// =============================================================================
// Singleton Instance
// =============================================================================

let _instance: PdfSignerService | null = null

/**
 * Get the PDF signer service instance
 */
export function getPdfSigner(): PdfSignerService {
    if (!_instance) {
        _instance = createPdfSigner()
    }
    return _instance
}
