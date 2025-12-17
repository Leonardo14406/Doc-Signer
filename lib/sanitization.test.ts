import { describe, it, expect, vi } from 'vitest'
import { sanitizeHtml, validateHtml, normalizeHtml } from './sanitization'

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

        it('should strip inline styles (strict)', async () => {
            const input = '<p style="color: red">Red</p>'
            expect(await sanitizeHtml(input)).toBe('<p>Red</p>')
        })

        it('should strip unknown tags but keep content', async () => {
            const input = '<p>Normal <foo>Unknown</foo></p>'
            expect(await sanitizeHtml(input)).toBe('<p>Normal Unknown</p>')
        })

        it('should log stripped content via callback', async () => {
            const spy = vi.fn()
            await sanitizeHtml('<script>alert()</script>', { onSanitization: spy })
            expect(spy).toHaveBeenCalledWith(expect.stringContaining('Stripped tag: <script>'))
        })

        it('should throw in strict mode if stripped', async () => {
            await expect(sanitizeHtml('<script>alert()</script>', { strict: true }))
                .rejects.toThrow('Document failed strict validation')
        })
    })

    describe('validateHtml', () => {
        it('should pass valid html', async () => {
            const { valid, violations } = await validateHtml('<p>Good</p>')
            expect(valid).toBe(true)
            expect(violations).toHaveLength(0)
        })

        it('should fail invalid html', async () => {
            const { valid, violations } = await validateHtml('<script>Bad</script>')
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
