/**
 * Document Upload Hook
 * 
 * Handles file upload to server-side API for validation and parsing.
 * The server returns sanitized HTML as the single source of truth.
 */

'use client'

import { useState, useCallback } from 'react'
import { validateFileUpload } from '@/lib/schemas'
import type { DocumentContent, ConvertResponse, ApiError } from '@/lib/types'

// =============================================================================
// Types
// =============================================================================

export interface UseDocumentUploadReturn {
    /** Upload and parse a DOCX file via server API */
    upload: (file: File) => Promise<DocumentContent | null>
    /** Whether upload is in progress */
    isUploading: boolean
    /** Upload progress (0-100) */
    progress: number
    /** Error message if upload failed */
    error: string | null
    /** Clear error state */
    clearError: () => void
}

// =============================================================================
// Hook
// =============================================================================

/**
 * Hook for handling document upload with server-side processing
 */
export function useDocumentUpload(): UseDocumentUploadReturn {
    const [isUploading, setIsUploading] = useState(false)
    const [progress, setProgress] = useState(0)
    const [error, setError] = useState<string | null>(null)

    const clearError = useCallback(() => {
        setError(null)
    }, [])

    const upload = useCallback(async (file: File): Promise<DocumentContent | null> => {
        setError(null)
        setProgress(0)

        // Client-side pre-validation (fast feedback)
        const validation = validateFileUpload(file)
        if (!validation.success) {
            const errorMessage = validation.error.errors[0]?.message || 'Invalid file'
            setError(errorMessage)
            return null
        }

        setIsUploading(true)
        setProgress(10)

        try {
            // Prepare form data
            const formData = new FormData()
            formData.append('file', file)

            setProgress(30)

            // Send to server API for processing
            const response = await fetch('/api/convert', {
                method: 'POST',
                body: formData,
            })

            setProgress(70)

            // Parse response
            const data = await response.json()

            // Handle error responses
            if (!response.ok) {
                const apiError = data.error as ApiError
                setError(apiError?.message || `Server error: ${response.status}`)
                return null
            }

            setProgress(90)

            // Success - build DocumentContent from response
            const convertResponse = data as ConvertResponse

            const documentContent: DocumentContent = {
                html: convertResponse.html,
                metadata: {
                    filename: convertResponse.metadata.filename,
                    sizeBytes: convertResponse.metadata.sizeBytes,
                    mimeType: convertResponse.metadata.mimeType,
                    uploadedAt: new Date(convertResponse.metadata.uploadedAt),
                },
                warnings: convertResponse.warnings,
            }

            setProgress(100)
            return documentContent
        } catch (err) {
            // Handle network errors
            if (err instanceof TypeError && err.message.includes('fetch')) {
                setError('Network error: Could not connect to server')
            } else {
                const errorMessage = err instanceof Error ? err.message : 'Failed to process document'
                setError(errorMessage)
            }
            return null
        } finally {
            setIsUploading(false)
        }
    }, [])

    return {
        upload,
        isUploading,
        progress,
        error,
        clearError,
    }
}
