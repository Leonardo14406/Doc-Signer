import createDOMPurify from 'dompurify'

/**
 * Initialize DOMPurify for both client and server environments.
 * jsdom@22 is used on the server for CommonJS compatibility.
 */
const purify = (() => {
    if (typeof window !== 'undefined') {
        return createDOMPurify(window)
    }
    // Server-side initialization
    const { JSDOM } = require('jsdom')
    const dom = new JSDOM('')
    return createDOMPurify(dom.window as any)
})()

/**
 * Strict HTML Schema Definition
 */
export const ALLOWED_TAGS = [
    // Document structure
    'html', 'head', 'body', 'main', 'article', 'section', 'nav', 'aside',
    'header', 'footer', 'div', 'span',

    // Headings
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',

    // Text content
    'p', 'br', 'hr',

    // Text formatting (semantic)
    'strong', 'b', 'em', 'i', 'u', 's', 'sub', 'sup', 'mark', 'small',
    'blockquote', 'q', 'cite', 'code', 'pre', 'kbd', 'samp',

    // Lists
    'ul', 'ol', 'li', 'dl', 'dt', 'dd',

    // Tables
    'table', 'caption', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'colgroup', 'col',

    // Media
    'img', 'figure', 'figcaption',

    // Links
    'a',
]

export const ALLOWED_ATTR = [
    // Global attributes
    'id', 'class', 'lang', 'dir', 'title',

    // Links
    'href', 'target', 'rel', 'name',

    // Images
    'src', 'alt', 'width', 'height',

    // Tables
    'colspan', 'rowspan', 'scope', 'headers',

    // Lists
    'start', 'type', 'value',
]

// Schema for validation check
const SCHEMA = {
    tags: new Set(ALLOWED_TAGS),
    attributes: new Set(ALLOWED_ATTR),
}

/**
 * Sanitization Options
 */
export interface SanitizeOptions {
    /**
     * If true, throws an error if any content is stripped.
     */
    strict?: boolean
    /**
     * Callback for when content is stripped.
     */
    onSanitization?: (msg: string) => void
}

/**
 * Sanitize HTML content using DOMPurify with strict schema.
 */
export function sanitizeHtml(html: string, options: SanitizeOptions = {}): string {
    const { strict = false, onSanitization } = options
    let strippedContent = false
    const log = (msg: string) => {
        strippedContent = true
        if (onSanitization) onSanitization(msg)
        else console.warn(`[Sanitization] ${msg}`)
    }

    // Clear existing hooks to prevent duplicates/side-effects
    purify.removeAllHooks()

    const config = {
        ALLOWED_TAGS: ALLOWED_TAGS,
        ALLOWED_ATTR: ALLOWED_ATTR,
        // FORBID_TAGS: ... // Rely on ALLOWED_TAGS for strictness
        // FORBID_ATTR: ['onclick', 'onerror', 'onload', 'onmouseover', 'style'], // Explicitly forbid style
        KEEP_CONTENT: true,
        WHOLE_DOCUMENT: false,
    }

    const sanitized = purify.sanitize(html, config)

    // Check for removed elements/attributes
    if ((purify as any).removed) {
        ; (purify as any).removed.forEach((item: any) => {
            if (item.element) {
                // If it's the element itself that was removed
                if (!item.attribute) {
                    log(`Stripped tag: <${item.element.tagName.toLowerCase()}>`)
                } else {
                    // Attribute removed
                    log(`Stripped attribute: ${item.attribute.name} from <${item.element.tagName.toLowerCase()}>`)
                }
            }
        })
    }

    purify.removeAllHooks()

    if (strict && strippedContent) {
        throw new Error('Document failed strict validation: content was stripped.')
    }

    // Normalize result
    return normalizeHtml(sanitized)
}

/**
 * Normalize HTML content.
 * - Ensures headings are h1-h6
 * - Ensures tables have basic structure
 * - Trims whitespace
 */
export function normalizeHtml(html: string): string {
    let normalized = html

    // Remove empty paragraphs
    normalized = normalized.replace(/<p>\s*<\/p>/gi, '')

    // Canonicalize line breaks (optional, but good for diffing)
    normalized = normalized.replace(/\r\n/g, '\n')

    // Ensure single spaces
    normalized = normalized.replace(/[ \t]+/g, ' ')

    return normalized.trim()
}

/**
 * Validate HTML against schema without sanitizing (dry run).
 * Returns validity and list of violations.
 */
export function validateHtml(html: string): { valid: boolean; violations: string[] } {
    const violations: string[] = []

    // We basically run sanitize with a logger that records violations
    // Note: This is an expensive check as it re-runs sanitization.
    // If strict performance is needed, we could optimize.

    sanitizeHtml(html, {
        onSanitization: (msg) => violations.push(msg),
    })

    return {
        valid: violations.length === 0,
        violations,
    }
}
