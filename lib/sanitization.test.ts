import { describe, it, expect, vi } from 'vitest'
import { sanitizeHtml, normalizeHtml } from './sanitization'

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

        it('should strip inline styles', () => {
            const input = '<p style="color: red">Red</p>'
            expect(sanitizeHtml(input)).toBe('<p>Red</p>')
        })

        it('should strip unknown tags but keep content', () => {
            const input = '<p>Normal <foo>Unknown</foo></p>'
            expect(sanitizeHtml(input)).toBe('<p>Normal Unknown</p>')
        })

        it('should trigger callback for significant stripping in strict mode', () => {
            const spy = vi.fn()
            // Heuristic triggers stripping if output is much smaller or tags are gone
            sanitizeHtml('<script>alert()</script>'.repeat(10), { strict: true, onSanitization: spy })
            expect(spy).toHaveBeenCalled()
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
