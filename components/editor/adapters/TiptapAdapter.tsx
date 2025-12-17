/**
 * Tiptap Editor Adapter
 * 
 * Production-ready editor implementation using Tiptap.
 * Handles strict HTML output, sanitization, and format state tracking.
 */

'use client'

import { useEditor, EditorContent as TiptapEditorContent, type Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import { useEffect, useRef, useCallback } from 'react'
import { sanitizeHtml } from '@/lib/sanitization'
import { useEditorContext, type EditorInstance } from '../EditorProvider'
import type { EditorCommand } from '@/hooks/useEditor'

// =============================================================================
// Constants
// =============================================================================

const AUTOSAVE_DEBOUNCE_MS = 750

const EXTENSIONS = [
    StarterKit.configure({
        heading: {
            levels: [1, 2, 3],
        },
    }),
    Underline,
    TextAlign.configure({
        types: ['heading', 'paragraph'],
    }),
]

// =============================================================================
// Types
// =============================================================================

interface TiptapAdapterProps {
    initialContent?: string
    onChange?: (html: string) => void
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Extract active formatting state from editor
 */
function getActiveFormats(editor: Editor): Record<string, boolean | number | string> {
    return {
        bold: editor.isActive('bold'),
        italic: editor.isActive('italic'),
        underline: editor.isActive('underline'),
        paragraph: editor.isActive('paragraph'),
        heading: editor.isActive('heading', { level: 1 }) ? 1 :
            editor.isActive('heading', { level: 2 }) ? 2 :
                editor.isActive('heading', { level: 3 }) ? 3 : 0,
        textAlign: editor.isActive({ textAlign: 'center' }) ? 'center' :
            editor.isActive({ textAlign: 'right' }) ? 'right' :
                editor.isActive({ textAlign: 'justify' }) ? 'justify' : 'left',
    }
}

/**
 * Execute generic editor command on Tiptap instance
 */
function execTiptapCommand(editor: Editor, command: EditorCommand) {
    switch (command.type) {
        case 'bold':
            editor.chain().focus().toggleBold().run()
            break
        case 'italic':
            editor.chain().focus().toggleItalic().run()
            break
        case 'underline':
            editor.chain().focus().toggleUnderline().run()
            break
        case 'alignLeft':
            editor.chain().focus().setTextAlign('left').run()
            break
        case 'alignCenter':
            editor.chain().focus().setTextAlign('center').run()
            break
        case 'alignRight':
            editor.chain().focus().setTextAlign('right').run()
            break
        case 'heading':
            editor.chain().focus().toggleHeading({ level: command.level }).run()
            break
        case 'paragraph':
            editor.chain().focus().setParagraph().run()
            break
    }
}

// =============================================================================
// Component
// =============================================================================

export function TiptapAdapter({ initialContent = '', onChange }: TiptapAdapterProps) {
    const { registerEditor } = useEditorContext()
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

    // Ref to hold the instance methods to prevent circular dependency
    const instanceRef = useRef<EditorInstance>({
        getHTML: () => '',
        setContent: () => { },
        execCommand: () => { },
        isReady: false,
        onUpdate: undefined,
    })

    // Initialize Tiptap
    const editor = useEditor({
        extensions: EXTENSIONS,
        content: initialContent, // Initial load only

        // Updates
        onUpdate: ({ editor }) => {
            // 1. Update instance UI state immediately
            instanceRef.current.onUpdate?.(getActiveFormats(editor))

            // 2. Debounced save
            if (onChange) {
                if (saveTimeoutRef.current) {
                    clearTimeout(saveTimeoutRef.current)
                }

                saveTimeoutRef.current = setTimeout(async () => {
                    const rawHtml = editor.getHTML()
                    // Strict sanitization before saving
                    const cleanHtml = await sanitizeHtml(rawHtml, {
                        onSanitization: (msg) => console.warn(`[Editor] ${msg}`)
                    })
                    onChange(cleanHtml)
                }, AUTOSAVE_DEBOUNCE_MS)
            }
        },

        // Selection changes (cursor movement) - update UI state
        onSelectionUpdate: ({ editor }) => {
            instanceRef.current.onUpdate?.(getActiveFormats(editor))
        },

        editorProps: {
            attributes: {
                class: 'prose prose-sm sm:prose lg:prose-lg max-w-none focus:outline-none min-h-[297mm] p-[20mm] bg-white text-black shadow-lg mx-auto',
            },
        },
    })

    // Sync instanceRef and register with provider
    useEffect(() => {
        if (editor) {
            instanceRef.current.getHTML = () => editor.getHTML()
            instanceRef.current.setContent = (html) => {
                // Only update if different to prevent cursor jumping
                if (html !== editor.getHTML()) {
                    editor.commands.setContent(html)
                }
            }
            instanceRef.current.execCommand = (cmd) => execTiptapCommand(editor, cmd)
            instanceRef.current.isReady = true

            registerEditor(instanceRef.current)

            // Push initial state
            instanceRef.current.onUpdate?.(getActiveFormats(editor))
        }

        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current)
            }
            registerEditor(null)
        }
    }, [editor, registerEditor])

    if (!editor) {
        return null
    }

    return (
        <div className="flex-1 overflow-auto bg-gray-100 p-8 dark:bg-gray-900/50">
            <TiptapEditorContent
                editor={editor}
                className="document-editor-container"
            />
        </div>
    )
}
