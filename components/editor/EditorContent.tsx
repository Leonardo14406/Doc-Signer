/**
 * Editor Content Wrapper
 * 
 * Renders the configured editor adapter (Tiptap).
 * Handles connection between EditorProvider context and the adapter.
 */

'use client'

import { TiptapAdapter } from './adapters/TiptapAdapter'
import { useEditorContext } from './EditorProvider'

// =============================================================================
// Component
// =============================================================================

export function EditorContent() {
    const { content, setContent } = useEditorContext()

    return (
        <TiptapAdapter
            initialContent={content}
            onChange={setContent}
        />
    )
}
