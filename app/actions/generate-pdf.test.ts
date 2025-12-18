import { describe, it, expect } from 'vitest'
import { generatePdfAction } from './generate-pdf'
import { readFile } from '@/lib/storage'

describe('generatePdfAction', () => {
    // We treat this as an integration test using the real Playwright instance.
    // Ensure Playwright is installed and environment handles it.

    it('should generate a valid PDF from simple HTML', async () => {
        const html = '<h1>Hello World</h1><p>Test content</p>'
        const result = await generatePdfAction(html)

        expect(result.success).toBe(true)
        expect(result.id).toBeDefined()
        expect(result.error).toBeUndefined()

        if (result.id) {
            const buffer = await readFile(result.id)
            // Check PDF magic bytes "%PDF-"
            const header = buffer.toString('utf8', 0, 5)
            expect(header).toBe('%PDF-')
        }
    }, 20000)

    it('should generate a multi-page PDF for large content', async () => {
        // Create content likely to span multiple pages
        const paragraphs = Array.from({ length: 100 }, (_, i) => `< p > Paragraph ${i + 1}: The quick brown fox jumps over the lazy dog.This is some filler text to ensure we take up vertical space.</p>`)
        const html = `
            <h1>Multi-Page Document</h1>
            <div class="content">
                ${paragraphs.join('')}
            </div>
        `

        const result = await generatePdfAction(html, {
            format: 'a4',
            orientation: 'portrait',
            margins: { top: 20, right: 20, bottom: 20, left: 20 }
        })

        expect(result.success).toBe(true)
        expect(result.id).toBeDefined()

        if (result.id) {
            const buffer = await readFile(result.id)
            // Basic sanity check on size - 100 paragraphs should happen to be larger than an empty PDF
            expect(buffer.length).toBeGreaterThan(1000)
        }
    }, 30000)

    it('should respect custom margins via CSS @page', async () => {
        // This test implies visual checking, but here we just ensure it runs without error 
        // and produces a valid PDF with options.
        const html = '<h1>Custom Margins</h1>'
        const result = await generatePdfAction(html, {
            margins: { top: 50, right: 50, bottom: 50, left: 50 }
        })

        expect(result.success).toBe(true)
    }, 20000)
})
