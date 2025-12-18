import sanitize from 'sanitize-html'

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

/**
 * Specific allowed attributes per tag for strictness
 */
export const ALLOWED_ATTRIBUTES: Record<string, string[]> = {
    '*': ['id', 'class', 'lang', 'dir', 'title'],
    'a': ['href', 'target', 'rel', 'name'],
    'img': ['src', 'alt', 'width', 'height'],
    'table': ['id', 'class'],
    'td': ['colspan', 'rowspan', 'scope', 'headers'],
    'th': ['colspan', 'rowspan', 'scope', 'headers'],
    'ol': ['start', 'type', 'value'],
    'li': ['value'],
}

/**
 * Sanitization Options
 */
export interface SanitizeOptions {
    /**
     * If true, throws an error if significant content stripping is detected.
     */
    strict?: boolean
    /**
     * Callback invoked when content is stripped.
     */
    onSanitization?: (msg: string) => void
}

/**
 * Sanitize HTML content using sanitize-html with a strict schema.
 * Runs in pure Node.js environments without DOM dependencies.
 */
export function sanitizeHtml(html: string, options: SanitizeOptions = {}): string {
    const { strict = false, onSanitization } = options

    // Track if anything was dropped (crude method for sanitize-html)
    let dropped = false

    const sanitizeOptions: sanitize.IOptions = {
        allowedTags: ALLOWED_TAGS,
        allowedAttributes: ALLOWED_ATTRIBUTES,
        allowedStyles: {},
        allowedSchemes: ['http', 'https', 'mailto', 'data'],
        allowedSchemesByTag: {
            img: ['http', 'https', 'data']
        }
    }

    const sanitized = sanitize(html, sanitizeOptions)

    // Basic heuristic: if the sanitized output is much smaller, or original had tags but output doesn't
    if (strict && onSanitization) {
        if (html.includes('<') && !sanitized.includes('<') && html.length > 10) {
            dropped = true
            onSanitization('Heavy tag stripping detected')
        }
    }

    if (strict && dropped) {
        throw new Error('Document failed strict validation: content was stripped.')
    }

    return normalizeHtml(sanitized)
}

/**
 * Normalize HTML content.
 */
export function normalizeHtml(html: string): string {
    let normalized = html
    normalized = normalized.replace(/<p>\s*<\/p>/gi, '')
    normalized = normalized.replace(/\r\n/g, '\n')
    normalized = normalized.replace(/[ \t]+/g, ' ')
    return normalized.trim()
}
