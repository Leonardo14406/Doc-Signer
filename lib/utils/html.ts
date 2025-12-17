/**
 * HTML processing utilities
 */

/**
 * Basic HTML sanitization
 * 
 * Note: For production use, consider a proper sanitizer like DOMPurify
 */
import { sanitizeHtml as strictSanitizeHtml, normalizeHtml as strictNormalizeHtml } from '@/lib/sanitization'

/**
 * Basic HTML sanitization
 * 
 * Note: For production use, consider a proper sanitizer like DOMPurify
 */
export function sanitizeHtml(html: string): string {
  return strictSanitizeHtml(html)
}

/**
 * Normalize HTML for consistent rendering
 */
export function normalizeHtml(html: string): string {
  return strictNormalizeHtml(html)
}

/**
 * Extract plain text from HTML
 */
export function htmlToPlainText(html: string): string {
  const div = document.createElement('div')
  div.innerHTML = html
  return div.textContent || div.innerText || ''
}

/**
 * Check if HTML content is effectively empty
 */
export function isHtmlEmpty(html: string): boolean {
  const text = htmlToPlainText(html)
  return text.trim().length === 0
}

/**
 * Wrap HTML content in a basic document structure
 */
export function wrapHtmlContent(content: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body {
            font-family: Arial, sans-serif;
            font-size: 12pt;
            line-height: 1.6;
            color: #000;
            background: #fff;
          }
        </style>
      </head>
      <body>
        ${content}
      </body>
    </html>
  `.trim()
}
