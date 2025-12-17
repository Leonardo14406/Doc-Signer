/**
 * Document-related type definitions
 * 
 * All document entities and their metadata are defined here.
 * These types are used across services, hooks, and components.
 */

// =============================================================================
// Document Metadata
// =============================================================================

/**
 * Metadata about an uploaded document
 */
export interface DocumentMetadata {
    /** Original filename including extension */
    filename: string
    /** File size in bytes */
    sizeBytes: number
    /** MIME type of the original file */
    mimeType: string
    /** Timestamp when document was uploaded */
    uploadedAt: Date
}

// =============================================================================
// Document Content
// =============================================================================

/**
 * Parsed document content in canonical HTML format
 * 
 * All document transformations flow through this format:
 * DOCX -> DocumentContent (HTML) -> PDF
 */
export interface DocumentContent {
    /** Sanitized HTML content of the document */
    html: string
    /** Metadata about the source document */
    metadata: DocumentMetadata
    /** Warnings generated during parsing (e.g., unsupported features) */
    warnings: string[]
}

// =============================================================================
// Signature Types
// =============================================================================

/**
 * Position and dimensions for signature placement
 * Coordinates are in PDF points (1/72 inch) from bottom-left origin
 */
export interface SignaturePosition {
    /** Page number (1-indexed) */
    page: number
    /** X coordinate from left edge */
    x: number
    /** Y coordinate from bottom edge */
    y: number
    /** Width of signature area */
    width: number
    /** Height of signature area */
    height: number
}

/**
 * Signature data ready for embedding
 */
export interface SignatureData {
    /** Signature image as base64-encoded PNG */
    imageBase64: string
    /** Position where signature should be placed */
    position: SignaturePosition
    /** Unix timestamp when signature was created */
    createdAt: number
}

/**
 * Raw signature stroke data (for potential reconstruction)
 */
export interface SignatureStroke {
    /** Sequence of points forming the stroke */
    points: Array<{ x: number; y: number }>
    /** Stroke width in pixels */
    width: number
    /** Stroke color (CSS color string) */
    color: string
}

// =============================================================================
// Signed Document
// =============================================================================

/**
 * Final signed PDF document
 */
export interface SignedDocument {
    /** PDF content as Uint8Array */
    pdfBytes: Uint8Array
    /** Original document metadata */
    sourceMetadata: DocumentMetadata
    /** All signatures applied to the document */
    signatures: SignatureData[]
    /** Timestamp when document was signed */
    signedAt: Date
}

// =============================================================================
// Processing Options
// =============================================================================

/**
 * Options for PDF generation
 */
export interface PdfGenerationOptions {
    /** Page format (default: 'a4') */
    format?: 'a4' | 'letter' | 'legal'
    /** Page orientation (default: 'portrait') */
    orientation?: 'portrait' | 'landscape'
    /** Margins in millimeters */
    margins?: {
        top: number
        right: number
        bottom: number
        left: number
    }
}

/**
 * Options for DOCX parsing
 */
export interface ParseOptions {
    /** Whether to include images (default: true) */
    includeImages?: boolean
    /** Custom style mappings for mammoth */
    styleMap?: string[]
}
