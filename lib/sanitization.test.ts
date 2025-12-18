/**
 * @vitest-environment node
 */
import { describe, it, expect, vi } from 'vitest'
import { sanitizeHtml, normalizeHtml } from './sanitization'

describe('Sanitization Library', () => {
    describe('sanitizeHtml', () => {
        it('should allow valid semantic tags', async () => {
            const input = '<h1>Title</h1><p>Paragraph</p><ul><li>List</li></ul>'
            expect(await sanitizeHtml(input)).toBe(input)
        })

        it('should strip script tags', async () => {
            const input = '<p>Test</p><script>alert("xss")</script>'
            expect(await sanitizeHtml(input)).toBe('<p>Test</p>')
        })

        it('should strip event handlers', async () => {
            const input = '<p onclick="alert(1)">Click me</p>'
            expect(await sanitizeHtml(input)).toBe('<p>Click me</p>')
        })

        it('should strip inline styles', async () => {
            const input = '<p style="color: red">Red</p>'
            expect(await sanitizeHtml(input)).toBe('<p>Red</p>')
        })

        it('should strip unknown tags but keep content', async () => {
            const input = '<p>Normal <foo>Unknown</foo></p>'
            expect(await sanitizeHtml(input)).toBe('<p>Normal Unknown</p>')
        })

        it('should trigger callback for significant stripping in strict mode', async () => {
            const spy = vi.fn()
            // In strict mode, it should throw AND call the callback
            await expect(
                sanitizeHtml('<script>alert()</script>'.repeat(10), { strict: true, onSanitization: spy })
            ).rejects.toThrow('Document failed strict validation')

            expect(spy).toHaveBeenCalledWith('Heavy tag stripping detected')
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
