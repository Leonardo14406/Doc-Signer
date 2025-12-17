/**
 * Editor Hook
 * 
 * Abstraction layer for rich text editor operations.
 * Currently a stub - will be implemented with Tiptap.
 */

'use client'

import { useState, useCallback } from 'react'

// =============================================================================
// Types
// =============================================================================

/**
 * Editor command types
 */
export type EditorCommand =
    | { type: 'bold' }
    | { type: 'italic' }
    | { type: 'underline' }
    | { type: 'alignLeft' }
    | { type: 'alignCenter' }
    | { type: 'alignRight' }
    | { type: 'heading'; level: 1 | 2 | 3 }
    | { type: 'paragraph' }

export interface UseEditorReturn {
    /** Current HTML content */
    content: string
    /** Update HTML content */
    setContent: (html: string) => void
    /** Execute an editor command */
    execCommand: (command: EditorCommand) => void
    /** Whether editor is ready */
    isReady: boolean
    /** Whether content has been modified */
    isDirty: boolean
    /** Reset dirty state */
    markClean: () => void
}

// =============================================================================
// Hook
// =============================================================================

/**
 * Hook for editor operations
 * 
 * This is a minimal implementation. In the full implementation,
 * this would integrate with Tiptap editor instance.
 */
export function useEditor(initialContent: string = ''): UseEditorReturn {
    const [content, setContentState] = useState(initialContent)
    const [isDirty, setIsDirty] = useState(false)
    const [isReady, setIsReady] = useState(true)

    const setContent = useCallback((html: string) => {
        setContentState(html)
        setIsDirty(true)
    }, [])

    const execCommand = useCallback((command: EditorCommand) => {
        // Stub implementation
        // In full implementation, this would dispatch to Tiptap editor
        console.log('Editor command:', command)
    }, [])

    const markClean = useCallback(() => {
        setIsDirty(false)
    }, [])

    return {
        content,
        setContent,
        execCommand,
        isReady,
        isDirty,
        markClean,
    }
}
