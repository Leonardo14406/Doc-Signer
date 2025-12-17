'use server'

import puppeteer from 'puppeteer'
import { PdfGenerationOptions } from '@/lib/types'
import { saveFile } from '@/lib/storage'

type PdfFormat = 'A4' | 'Letter' | 'Legal'

interface GeneratePdfResult {
  success: boolean
  id?: string // File ID
  error?: string
}

export async function generatePdfAction(html: string, options?: PdfGenerationOptions): Promise<GeneratePdfResult> {
  const format = (options?.format ? options.format.charAt(0).toUpperCase() + options.format.slice(1) : 'A4') as PdfFormat
  const landscape = options?.orientation === 'landscape'
  const margins = options?.margins || { top: 20, right: 20, bottom: 20, left: 20 }

  let browser
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })

    const page = await browser.newPage()

    // Construct full HTML with styles for pagination
    const validHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            @page {
              size: ${format} ${landscape ? 'landscape' : 'portrait'};
              margin: ${margins.top}mm ${margins.right}mm ${margins.bottom}mm ${margins.left}mm;
            }
            html, body {
              margin: 0;
              padding: 0;
              font-family: Arial, Helvetica, sans-serif;
              font-size: 12pt;
              line-height: 1.5;
            }
            
            /* Typography */
            h1, h2, h3, h4, h5, h6 {
              page-break-after: avoid;
              break-after: avoid;
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
            }
            td, th {
              border: 1px solid #ddd;
              padding: 8px;
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
          ${html}
        </body>
      </html>
    `

    await page.setContent(validHtml, {
      waitUntil: 'networkidle0',
      timeout: 30000,
    })

    const pdfBuffer = await page.pdf({
      format: format,
      landscape: landscape,
      printBackground: true,
      preferCSSPageSize: true, // Respect @page rules
    })

    // Save to storage
    const id = await saveFile(Buffer.from(pdfBuffer))

    return {
      success: true,
      id: id,
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
}
