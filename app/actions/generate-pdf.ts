'use server'

/**
 * Generate PDF Server Action
 * 
 * Server action for HTML to PDF conversion.
 * Delegates to the PDF generator service and handles storage.
 */

import { getPdfGenerator } from '@/lib/services'
import { saveFile } from '@/lib/storage'
import { handleActionError } from '@/lib/errors'
import type { PdfGenerationOptions } from '@/lib/types'

// =============================================================================
// Types
// =============================================================================

interface GeneratePdfResult {
  success: boolean
  id?: string
  error?: string
}

// =============================================================================
// Server Action
// =============================================================================

/**
 * Generate a PDF from HTML content and save to storage
 * 
 * @param html - HTML content to convert
 * @param options - PDF generation options
 * @returns Result with file ID or error
 */
export async function generatePdfAction(
  html: string,
  options?: PdfGenerationOptions
): Promise<GeneratePdfResult> {
  try {
    const generator = getPdfGenerator()
    const result = await generator.generate(html, options)

    if (!result.success) {
      return {
        success: false,
        error: result.error,
      }
    }

    // Save to storage and return file ID
    const id = await saveFile(result.pdfBuffer)

    return {
      success: true,
      id,
    }
  } catch (error) {
    return handleActionError(error)
  }
}
