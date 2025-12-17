/**
 * Editor Provider Component
 * 
 * Context provider for editor operations.
 * Abstracts the editor implementation to allow swapping libraries.
 */

'use client'

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import type { EditorCommand } from '@/hooks/useEditor'

// =============================================================================
// Context Types
// =============================================================================

interface EditorContextValue {
    /** Current HTML content */
    content: string
    /** Update content */
    setContent: (html: string) => void
    /** Execute an editor command */
    execCommand: (command: EditorCommand) => void
    /** Whether the editor is ready */
    isReady: boolean
    /** Whether content has been modified */
    isDirty: boolean
    /** Register the editor instance (used by adapter) */
    registerEditor: (editor: EditorInstance | null) => void
    /** Active formatting states (bold, italic, heading level, etc.) */
    activeFormats: Record<string, boolean | number | string>
}

/**
 * Generic editor instance interface
 * Adapters should conform to this interface
 */
export interface EditorInstance {
    getHTML: () => string
    setContent: (html: string) => void
    execCommand: (command: EditorCommand) => void
    isReady: boolean
    /** Callback for the editor to push active format updates to the provider */
    onUpdate?: (formats: Record<string, boolean | number | string>) => void
}

// =============================================================================
// Context
// =============================================================================

const EditorContext = createContext<EditorContextValue | null>(null)

// =============================================================================
// Provider
// =============================================================================

interface EditorProviderProps {
    children: ReactNode
    initialContent?: string
    onChange?: (html: string) => void
}

export function EditorProvider({
    children,
    initialContent = '',
    onChange,
}: EditorProviderProps) {
    const [content, setContentState] = useState(initialContent)
    const [isDirty, setIsDirty] = useState(false)
    const [editor, setEditor] = useState<EditorInstance | null>(null)
    const [activeFormats, setActiveFormats] = useState<Record<string, boolean | number | string>>({})

    // Expose a method for adapters to update state
    const updateActiveFormats = useCallback((formats: Record<string, boolean | number | string>) => {
        setActiveFormats(formats)
    }, [])

    const setContent = useCallback(
        (html: string) => {
            setContentState(html)
            setIsDirty(true)
            onChange?.(html)
        },
        [onChange]
    )

    const execCommand = useCallback(
        (command: EditorCommand) => {
            if (editor) {
                editor.execCommand(command)
            }
        },
        [editor]
    )

    const registerEditor = useCallback((instance: EditorInstance | null) => {
        setEditor(instance)
        if (instance) {
            if (initialContent) {
                instance.setContent(initialContent)
            }
            // Assign the update callback to the editor instance
            instance.onUpdate = updateActiveFormats;
        }
    }, [initialContent, updateActiveFormats])

    const value: EditorContextValue = {
        content,
        setContent,
        execCommand,
        isReady: editor?.isReady ?? false,
        isDirty,
        registerEditor,
        activeFormats,
    }

    return (
        <EditorContext.Provider value={value}>
            {children}
        </EditorContext.Provider>
    )
}

// =============================================================================
// Hook
// =============================================================================

/**
 * Hook to access editor context
 */
export function useEditorContext(): EditorContextValue {
    const context = useContext(EditorContext)
    if (!context) {
        throw new Error('useEditorContext must be used within an EditorProvider')
    }
    return context
}
