/**
 * PDF Generator Service
 * 
 * Handles HTML to PDF conversion using Playwright.
 * Pure business logic - no framework-specific code.
 */

import type { PdfGenerationOptions } from '@/lib/types'

// =============================================================================
// Configuration
// =============================================================================

type PdfFormat = 'A4' | 'Letter' | 'Legal'

const DEFAULT_MARGINS = { top: 20, right: 20, bottom: 20, left: 20 }

// =============================================================================
// Types
// =============================================================================

export interface PdfGeneratorResult {
    success: true
    pdfBuffer: Buffer
}

export interface PdfGeneratorError {
    success: false
    error: string
}

export type GeneratePdfResult = PdfGeneratorResult | PdfGeneratorError

// =============================================================================
// HTML Template
// =============================================================================

function buildHtmlDocument(html: string): string {
    return `
<!DOCTYPE html>
<html>
    <head>
        <style>
            @page {
                size: A4 portrait;
                margin: 20mm;
            }
            html, body {
                margin: 0;
                padding: 0;
                font-family: Arial, Helvetica, sans-serif;
                font-size: 12pt;
                line-height: 1.5;
                background: white;
            }
            
            .document-container {
                width: 100%;
                /* Ensure content respects the print area */
            }
            
            /* Typography */
            h1, h2, h3, h4, h5, h6 {
                page-break-after: avoid;
                break-after: avoid;
                margin-top: 1.5em;
                margin-bottom: 0.5em;
            }
            p {
                margin-bottom: 1em;
                orphans: 3;
                widows: 3;
            }
            
            /* Tables */
            table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 1em;
            }
            td, th {
                border: 1px solid #ddd;
                padding: 8px;
                text-align: left;
            }
            tr {
                page-break-inside: avoid;
                break-inside: avoid;
            }

            /* Images */
            img {
                max-width: 100%;
                height: auto;
                page-break-inside: avoid;
            }

            /* Utilities */
            .page-break {
                page-break-before: always;
            }
        </style>
    </head>
    <body>
        <div class="document-container">
            ${html}
        </div>
    </body>
</html>
`
}

// =============================================================================
// Service Interface
// =============================================================================

export interface PdfGeneratorService {
    /**
     * Generate a PDF from HTML content
     */
    generate(html: string, options?: PdfGenerationOptions): Promise<GeneratePdfResult>
}

// =============================================================================
// Implementation
// =============================================================================

/**
 * Create a PDF generator service instance
 */
export function createPdfGenerator(): PdfGeneratorService {
    return {
        async generate(html: string, options?: PdfGenerationOptions): Promise<GeneratePdfResult> {
            const format = (options?.format
                ? options.format.charAt(0).toUpperCase() + options.format.slice(1)
                : 'A4') as PdfFormat
            const landscape = options?.orientation === 'landscape'
            const margins = options?.margins || DEFAULT_MARGINS

            let browser
            try {
                const { chromium } = await import('playwright')

                browser = await chromium.launch({
                    headless: true,
                })

                const context = await browser.newContext()
                const page = await context.newPage()

                // Sanitize HTML before rendering
                // This protects against XSS/injection if the input comes from an untrusted source (e.g. client editor)
                const { sanitizeHtml } = await import('@/lib/sanitization')
                const safeHtml = await sanitizeHtml(html)

                const validHtml = buildHtmlDocument(safeHtml)

                await page.setContent(validHtml, {
                    waitUntil: 'networkidle',
                    timeout: 30000,
                })

                const pdfBuffer = await page.pdf({
                    format: format,
                    landscape: landscape,
                    printBackground: true,
                    margin: {
                        top: `${margins.top}mm`,
                        right: `${margins.right}mm`,
                        bottom: `${margins.bottom}mm`,
                        left: `${margins.left}mm`,
                    },
                })

                return {
                    success: true,
                    pdfBuffer: Buffer.from(pdfBuffer),
                }
            } catch (error) {
                console.error('PDF Generation failed:', error)
                return {
                    success: false,
                    error: error instanceof Error ? error.message : 'Unknown error occurred during PDF generation',
                }
            } finally {
                if (browser) {
                    await browser.close()
                }
            }
        },
    }
}

// =============================================================================
// Singleton Instance
// =============================================================================

let _instance: PdfGeneratorService | null = null

/**
 * Get the PDF generator service instance
 */
export function getPdfGenerator(): PdfGeneratorService {
    if (!_instance) {
        _instance = createPdfGenerator()
    }
    return _instance
}
