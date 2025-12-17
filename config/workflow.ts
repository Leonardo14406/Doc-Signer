/**
 * Workflow Configuration
 * 
 * Constants and configuration for the document signing workflow.
 */

// =============================================================================
// File Constraints
// =============================================================================

/** Maximum file size in bytes (10MB) */
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024

/** Maximum file size for display */
export const MAX_FILE_SIZE_DISPLAY = '10MB'

/** Allowed file extensions */
export const ALLOWED_EXTENSIONS = ['.docx'] as const

/** Allowed MIME types */
export const ALLOWED_MIME_TYPES = [
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
] as const

// =============================================================================
// PDF Configuration
// =============================================================================

/** Default PDF page format */
export const DEFAULT_PDF_FORMAT = 'a4' as const

/** Default PDF orientation */
export const DEFAULT_PDF_ORIENTATION = 'portrait' as const

/** Default PDF margins in mm */
export const DEFAULT_PDF_MARGINS = {
    top: 20,
    right: 20,
    bottom: 20,
    left: 20,
} as const

// =============================================================================
// Signature Configuration
// =============================================================================

/** Signature stroke color */
export const SIGNATURE_STROKE_COLOR = '#1a1a2e'

/** Signature stroke width in pixels */
export const SIGNATURE_STROKE_WIDTH = 3

/** PDF render scale factor */
export const PDF_RENDER_SCALE = 1.5

// =============================================================================
// UI Configuration
// =============================================================================

/** Animation durations in ms */
export const ANIMATION_DURATIONS = {
    fade: 300,
    slide: 500,
    scale: 200,
} as const

/** Toast notification duration in ms */
export const TOAST_DURATION = 5000
