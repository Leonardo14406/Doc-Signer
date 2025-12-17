'use server'

import { PDFDocument } from 'pdf-lib'
import type { SignatureData } from '@/lib/types'
import { readFile, saveFile } from '@/lib/storage'

interface SignPdfResult {
    success: boolean
    id?: string // Signed File ID
    error?: string
}

export async function signPdfAction(
    pdfId: string,
    signatures: SignatureData[] = [],
    overlays: Record<number, string> = {}
): Promise<SignPdfResult> {
    try {
        // Read PDF from storage
        const pdfBytes = await readFile(pdfId)

        // Load PDF
        const pdfDoc = await PDFDocument.load(pdfBytes)
        const pages = pdfDoc.getPages()

        // 1. Process explicit signatures (placed at coordinates)
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

            // pdf-lib uses bottom-left origin.
            page.drawImage(embeddedImage, {
                x: position.x,
                y: position.y,
                width: position.width,
                height: position.height, // PDF points
            })
        }

        // 2. Process full-page overlays (drawings)
        for (const [pageNumStr, imageBase64] of Object.entries(overlays)) {
            const pageNum = parseInt(pageNumStr, 10)
            const pageIndex = pageNum - 1

            if (pageIndex < 0 || pageIndex >= pages.length) continue;

            const page = pages[pageIndex]
            const { width, height } = page.getSize()

            const base64Data = imageBase64.replace(/^data:image\/png;base64,/, '')
            const imageBytes = Buffer.from(base64Data, 'base64')
            const embeddedImage = await pdfDoc.embedPng(imageBytes)

            page.drawImage(embeddedImage, {
                x: 0,
                y: 0,
                width: width,
                height: height
            })
        }

        // "Lock" the document
        pdfDoc.setTitle('Signed Document')
        pdfDoc.setAuthor('Antigravity User')
        pdfDoc.setProducer('Antigravity PDF Signer')
        pdfDoc.setModificationDate(new Date())

        // Save
        const signedPdfBytes = await pdfDoc.save()

        // Save to storage
        const id = await saveFile(Buffer.from(signedPdfBytes))

        return {
            success: true,
            id: id,
        }
    } catch (error) {
        console.error('PDF Signing failed:', error)
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error during signing',
        }
    }
}
