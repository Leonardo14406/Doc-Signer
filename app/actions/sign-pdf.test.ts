import { describe, it, expect } from 'vitest'
import { signPdfAction } from './sign-pdf'
import { PDFDocument } from 'pdf-lib'
import { readFile } from '@/lib/storage'

describe('signPdfAction', () => {
    // 1x1 pixel transparent PNG
    const dummyPngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='

    it('should sign a PDF with a signature object', async () => {
        // Create a blank PDF
        const doc = await PDFDocument.create()
        doc.addPage([100, 100])
        const pdfBytes = await doc.save()
        // Save dummy PDF to storage by-passing generatePdfAction for test setup
        const { saveFile } = await import('@/lib/storage')
        const pdfId = await saveFile(Buffer.from(pdfBytes))

        const signatures = [{
            imageBase64: dummyPngBase64,
            position: {
                page: 1,
                x: 0,
                y: 0,
                width: 10,
                height: 10
            },
            createdAt: Date.now()
        }]

        const result = await signPdfAction(pdfId, signatures, {})

        expect(result.success).toBe(true)
        expect(result.id).toBeDefined()

        if (result.id) {
            const signedPdfBuffer = await readFile(result.id)
            const signedPdf = await PDFDocument.load(signedPdfBuffer)
            // We can check if image is embedded, but metadata check is easier
            expect(signedPdf.getTitle()).toBe('Signed Document')
            expect(signedPdf.getProducer()).toBe('Antigravity PDF Signer')
        }
    })

    it('should sign a PDF with an overlay', async () => {
        const doc = await PDFDocument.create()
        doc.addPage([100, 100])
        const pdfBytes = await doc.save()
        const { saveFile } = await import('@/lib/storage')
        const pdfId = await saveFile(Buffer.from(pdfBytes))

        const overlays = {
            1: dummyPngBase64 // Page 1
        }

        const result = await signPdfAction(pdfId, [], overlays)

        expect(result.success).toBe(true)
        expect(result.id).toBeDefined()

        if (result.id) {
            const signedPdfBuffer = await readFile(result.id)
            const signedPdf = await PDFDocument.load(signedPdfBuffer)
            expect(signedPdf.getTitle()).toBe('Signed Document')
        }
    })

    it('should handle invalid pages gracefully', async () => {
        const doc = await PDFDocument.create()
        doc.addPage([100, 100])
        const pdfBytes = await doc.save()
        const { saveFile } = await import('@/lib/storage')
        const pdfId = await saveFile(Buffer.from(pdfBytes))

        // Try to sign page 2 which doesn't exist
        const result = await signPdfAction(pdfId, [], { 2: dummyPngBase64 })

        expect(result.success).toBe(true) // Should succeed but do nothing / log warning
        // We ensure it didn't crash
    })
})
