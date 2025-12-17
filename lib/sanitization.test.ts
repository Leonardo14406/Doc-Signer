import { describe, it, expect, vi } from 'vitest'
import { sanitizeHtml, validateHtml, normalizeHtml } from './sanitization'

describe('Sanitization Library', () => {
    describe('sanitizeHtml', () => {
        it('should allow valid semantic tags', () => {
            const input = '<h1>Title</h1><p>Paragraph</p><ul><li>List</li></ul>'
            expect(sanitizeHtml(input)).toBe(input)
        })

        it('should strip script tags', () => {
            const input = '<p>Test</p><script>alert("xss")</script>'
            expect(sanitizeHtml(input)).toBe('<p>Test</p>')
        })

        it('should strip event handlers', () => {
            const input = '<p onclick="alert(1)">Click me</p>'
            expect(sanitizeHtml(input)).toBe('<p>Click me</p>')
        })

        it('should strip inline styles (strict)', () => {
            const input = '<p style="color: red">Red</p>'
            expect(sanitizeHtml(input)).toBe('<p>Red</p>')
        })

        it('should strip unknown tags but keep content', () => {
            const input = '<p>Normal <foo>Unknown</foo></p>'
            expect(sanitizeHtml(input)).toBe('<p>Normal Unknown</p>')
        })

        it('should log stripped content via callback', () => {
            const spy = vi.fn()
            sanitizeHtml('<script>alert()</script>', { onSanitization: spy })
            expect(spy).toHaveBeenCalledWith(expect.stringContaining('Stripped tag: <script>'))
        })

        it('should throw in strict mode if stripped', () => {
            expect(() => {
                sanitizeHtml('<script>alert()</script>', { strict: true })
            }).toThrow('Document failed strict validation')
        })
    })

    describe('validateHtml', () => {
        it('should pass valid html', () => {
            const { valid, violations } = validateHtml('<p>Good</p>')
            expect(valid).toBe(true)
            expect(violations).toHaveLength(0)
        })

        it('should fail invalid html', () => {
            const { valid, violations } = validateHtml('<script>Bad</script>')
            expect(valid).toBe(false)
            expect(violations.length).toBeGreaterThan(0)
        })
    })

    describe('normalizeHtml', () => {
        it('should normalize whitespace', () => {
            expect(normalizeHtml('<p>  Hello   World  </p>')).toBe('<p> Hello World </p>')
        })

        it('should remove empty paragraphs', () => {
            expect(normalizeHtml('<p>Content</p><p>  </p>')).toBe('<p>Content</p>')
        })
    })
})
