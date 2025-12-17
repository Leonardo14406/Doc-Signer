/**
 * Editor Context Types and Hooks
 * 
 * Note: The useEditor hook itself is now used directly from @tiptap/react
 * in the TiptapAdapter, but we keep the shared types here.
 */

export type EditorCommand =
    | { type: 'bold' }
    | { type: 'italic' }
    | { type: 'underline' }
    | { type: 'alignLeft' }
    | { type: 'alignCenter' }
    | { type: 'alignRight' }
    | { type: 'paragraph' }
    | { type: 'heading'; level: 1 | 2 | 3 }

export interface EditorState {
    bold: boolean
    italic: boolean
    underline: boolean
    paragraph: boolean
    heading: number
    textAlign: string
}
