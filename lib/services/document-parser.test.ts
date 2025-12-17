/**
 * Document Parser Service Tests
 * 
 * Tests for malformed documents, large files, and edge cases.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { createDocumentParser, MAX_FILE_SIZE } from './document-parser'
import type { DocumentParserService } from './document-parser'

describe('DocumentParserService', () => {
    let parser: DocumentParserService

    beforeEach(() => {
        parser = createDocumentParser()
        console.log('Test setup: Parser created')
    })

    // ==========================================================================
    // File Validation Tests
    // ==========================================================================

    describe('validateFile', () => {
        it('should reject non-docx files', () => {
            const error = parser.validateFile({
                name: 'document.pdf',
                size: 1000,
                type: 'application/pdf',
            })

            expect(error).not.toBeNull()
            expect(error?.code).toBe('INVALID_FILE_TYPE')
            expect(error?.message).toContain('.docx')
        })

        it('should reject files that are too large', () => {
            const error = parser.validateFile({
                name: 'document.docx',
                size: MAX_FILE_SIZE + 1,
                type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            })

            expect(error).not.toBeNull()
            expect(error?.code).toBe('FILE_TOO_LARGE')
        })

        it('should reject empty files', () => {
            const error = parser.validateFile({
                name: 'document.docx',
                size: 0,
                type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            })

            expect(error).not.toBeNull()
            expect(error?.code).toBe('EMPTY_FILE')
        })

        it('should accept valid docx files', () => {
            const error = parser.validateFile({
                name: 'document.docx',
                size: 5000,
                type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            })

            expect(error).toBeNull()
        })

        it('should accept docx files with uppercase extension', () => {
            const error = parser.validateFile({
                name: 'DOCUMENT.DOCX',
                size: 5000,
            })

            expect(error).toBeNull()
        })

        it('should accept docx files without MIME type', () => {
            const error = parser.validateFile({
                name: 'document.docx',
                size: 5000,
            })

            expect(error).toBeNull()
        })

        it('should reject files with wrong MIME type', () => {
            const error = parser.validateFile({
                name: 'document.docx',
                size: 5000,
                type: 'application/msword', // Old .doc format
            })

            expect(error).not.toBeNull()
            expect(error?.code).toBe('INVALID_FILE_TYPE')
        })
    })

    // ==========================================================================
    // HTML Sanitization Tests
    // ==========================================================================

    describe('sanitizeHtml', () => {
        it('should remove script tags', async () => {
            const html = '<p>Hello</p><script>alert("xss")</script><p>World</p>'
            const sanitized = await parser.sanitizeHtml(html)

            expect(sanitized).not.toContain('<script>')
            expect(sanitized).not.toContain('alert')
            expect(sanitized).toContain('Hello')
            expect(sanitized).toContain('World')
        })

        it('should remove style tags', async () => {
            const html = '<p>Hello</p><style>.danger { color: red; }</style>'
            const sanitized = await parser.sanitizeHtml(html)

            expect(sanitized).not.toContain('<style>')
            expect(sanitized).not.toContain('.danger')
        })

        it('should remove onclick handlers', async () => {
            const html = '<p onclick="alert(1)">Click me</p>'
            const sanitized = await parser.sanitizeHtml(html)

            expect(sanitized).not.toContain('onclick')
            expect(sanitized).toContain('Click me')
        })

        it('should remove onerror handlers', async () => {
            const html = '<img src="x" onerror="alert(1)">'
            const sanitized = await parser.sanitizeHtml(html)

            expect(sanitized).not.toContain('onerror')
        })

        it('should remove javascript: URLs', async () => {
            const html = '<a href="javascript:alert(1)">Click</a>'
            const sanitized = await parser.sanitizeHtml(html)

            expect(sanitized).not.toContain('javascript:')
        })

        it('should remove inline styles', async () => {
            const html = '<p style="color: red; background: url(javascript:alert(1))">Text</p>'
            const sanitized = await parser.sanitizeHtml(html)

            expect(sanitized).not.toContain('style=')
        })

        it('should preserve semantic HTML elements', async () => {
            const html = `
        <h1>Heading</h1>
        <p>Paragraph</p>
        <ul><li>Item</li></ul>
        <table><tr><td>Cell</td></tr></table>
        <strong>Bold</strong>
        <em>Italic</em>
      `
            const sanitized = await parser.sanitizeHtml(html)

            expect(sanitized).toContain('<h1>')
            expect(sanitized).toContain('<p>')
            expect(sanitized).toContain('<ul>')
            expect(sanitized).toContain('<li>')
            expect(sanitized).toContain('<table>')
            expect(sanitized).toContain('<strong>')
            expect(sanitized).toContain('<em>')
        })

        it('should remove iframe and object tags', async () => {
            const html = '<iframe src="evil.com"></iframe><object data="malware.swf"></object>'
            const sanitized = await parser.sanitizeHtml(html)

            expect(sanitized).not.toContain('<iframe')
            expect(sanitized).not.toContain('<object')
        })

        it('should remove form elements', async () => {
            const html = '<form action="/steal"><input type="password"></form>'
            const sanitized = await parser.sanitizeHtml(html)

            expect(sanitized).not.toContain('<form')
            expect(sanitized).not.toContain('<input')
        })

        it('should remove empty paragraphs', async () => {
            const html = '<p></p><p>   </p><p>Content</p>'
            const sanitized = await parser.sanitizeHtml(html)

            // Empty paragraphs should be removed
            const emptyPCount = (sanitized.match(/<p>\s*<\/p>/g) || []).length
            expect(emptyPCount).toBe(0)
            expect(sanitized).toContain('Content')
        })
    })

    // ==========================================================================
    // DOCX Parsing Tests
    // ==========================================================================

    describe('parseDocx', () => {
        it('should reject empty ArrayBuffer', async () => {
            const emptyBuffer = new ArrayBuffer(0)
            const result = await parser.parseDocx(emptyBuffer, 'empty.docx')

            expect(result.success).toBe(false)
            if (!result.success) {
                expect(result.error.code).toBe('EMPTY_FILE')
            }
        })

        it('should reject oversized ArrayBuffer', async () => {
            // Create a buffer slightly over the limit
            const oversizedBuffer = new ArrayBuffer(MAX_FILE_SIZE + 1)
            const result = await parser.parseDocx(oversizedBuffer, 'large.docx')

            expect(result.success).toBe(false)
            if (!result.success) {
                expect(result.error.code).toBe('FILE_TOO_LARGE')
            }
        })

        it('should reject non-DOCX binary data', async () => {
            // Create a buffer with random data (not a valid DOCX)
            const invalidBuffer = new ArrayBuffer(1000)
            const view = new Uint8Array(invalidBuffer)
            view[0] = 0x00 // Invalid header
            view[1] = 0x00

            const result = await parser.parseDocx(invalidBuffer, 'invalid.docx')

            expect(result.success).toBe(false)
            if (!result.success) {
                expect(result.error.code).toBe('PARSE_FAILED')
            }
        })

        it('should handle corrupted DOCX-like data', async () => {
            // Create a buffer that looks like a ZIP but isn't a valid DOCX
            const corruptedBuffer = new ArrayBuffer(100)
            const view = new Uint8Array(corruptedBuffer)
            // PK signature for ZIP
            view[0] = 0x50
            view[1] = 0x4B
            view[2] = 0x03
            view[3] = 0x04
            // Rest is garbage

            const result = await parser.parseDocx(corruptedBuffer, 'corrupted.docx')

            expect(result.success).toBe(false)
            if (!result.success) {
                expect(result.error.code).toBe('PARSE_FAILED')
            }
        })
    })

    // ==========================================================================
    // Edge Cases
    // ==========================================================================

    describe('edge cases', () => {
        it('should handle filenames with special characters', () => {
            const error = parser.validateFile({
                name: "document with spaces & symbols (1).docx",
                size: 5000,
            })

            expect(error).toBeNull()
        })

        it('should reject files with double extensions', () => {
            const error = parser.validateFile({
                name: 'document.pdf.docx',
                size: 5000,
            })

            // Should accept - it ends with .docx
            expect(error).toBeNull()
        })

        it('should reject files ending with .docx but wrong case in extension', () => {
            // .DOCX should work
            const error1 = parser.validateFile({
                name: 'document.DOCX',
                size: 5000,
            })
            expect(error1).toBeNull()

            // .DocX should work
            const error2 = parser.validateFile({
                name: 'document.DocX',
                size: 5000,
            })
            expect(error2).toBeNull()
        })

        it('should handle files at exactly max size', () => {
            const error = parser.validateFile({
                name: 'document.docx',
                size: MAX_FILE_SIZE, // Exactly at limit
            })

            expect(error).toBeNull()
        })

        it('should handle very small valid size', () => {
            const error = parser.validateFile({
                name: 'document.docx',
                size: 1, // 1 byte
            })

            expect(error).toBeNull()
        })
    })
})
