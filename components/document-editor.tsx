"use client"

/**
 * Document Editor Component
 * 
 * Rich text editor using TipTap framework.
 * Ensures clean HTML output and robust editing experience.
 */

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
    Bold,
    Italic,
    Underline as UnderlineIcon,
    AlignLeft,
    AlignCenter,
    AlignRight,
    Type,
    ChevronRight,
    RotateCcw,
    Undo,
    Redo,
    AlertCircle,
} from "lucide-react"
import { Toggle } from "@/components/ui/toggle"
import { Separator } from "@/components/ui/separator"
import { Spinner } from "@/components/ui/spinner"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { usePdfGeneration } from "@/hooks"
import DocumentScaler from "@/components/ui/document-scaler"

// =============================================================================
// Styles
// =============================================================================

// ProseMirror customization to match the "Page" look
const EDITOR_CLASS_NAME =
    "prose prose-sm sm:prose lg:prose-lg xl:prose-xl focus:outline-none bg-white text-black shadow-lg mx-auto"

// =============================================================================
// Types
// =============================================================================

interface DocumentEditorProps {
    initialHtml: string
    onContinue: (pdfId: string) => void
    onCancel: () => void
}

// =============================================================================
// Component
// =============================================================================

export default function DocumentEditor({ initialHtml, onContinue, onCancel }: DocumentEditorProps) {
    const { generate, isGenerating, error, clearError } = usePdfGeneration()

    const editor = useEditor({
        immediatelyRender: false,
        extensions: [
            StarterKit,
            Underline,
            TextAlign.configure({
                types: ['heading', 'paragraph'],
            }),
        ],
        content: initialHtml,
        editorProps: {
            attributes: {
                class: EDITOR_CLASS_NAME,
            },
        },
    })

    if (!editor) {
        return null
    }

    // =========================================================================
    // Handlers
    // =========================================================================

    const handleGeneratePDF = async () => {
        clearError()
        const html = editor.getHTML()
        const pdfId = await generate(html)

        if (pdfId) {
            onContinue(pdfId)
        }
    }

    // =========================================================================
    // Render
    // =========================================================================

    return (
        <Card className="flex flex-col h-[85vh] overflow-hidden bg-background border-border shadow-2xl">
            {/* Toolbar */}
            <div className="flex items-center gap-2 p-2 border-b bg-muted/30 flex-wrap sticky top-0 z-10">
                {/* History */}
                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => editor.chain().focus().undo().run()}
                        disabled={!editor.can().chain().focus().undo().run()}
                        aria-label="Undo"
                    >
                        <Undo className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => editor.chain().focus().redo().run()}
                        disabled={!editor.can().chain().focus().redo().run()}
                        aria-label="Redo"
                    >
                        <Redo className="h-4 w-4" />
                    </Button>
                </div>

                <Separator orientation="vertical" className="h-6" />

                {/* Formatting */}
                <div className="flex items-center gap-1">
                    <Toggle
                        size="sm"
                        pressed={editor.isActive('bold')}
                        onPressedChange={() => editor.chain().focus().toggleBold().run()}
                        aria-label="Bold"
                    >
                        <Bold className="h-4 w-4" />
                    </Toggle>
                    <Toggle
                        size="sm"
                        pressed={editor.isActive('italic')}
                        onPressedChange={() => editor.chain().focus().toggleItalic().run()}
                        aria-label="Italic"
                    >
                        <Italic className="h-4 w-4" />
                    </Toggle>
                    <Toggle
                        size="sm"
                        pressed={editor.isActive('underline')}
                        onPressedChange={() => editor.chain().focus().toggleUnderline().run()}
                        aria-label="Underline"
                    >
                        <UnderlineIcon className="h-4 w-4" />
                    </Toggle>
                </div>

                <Separator orientation="vertical" className="h-6" />

                {/* Alignment */}
                <div className="flex items-center gap-1">
                    <Toggle
                        size="sm"
                        pressed={editor.isActive({ textAlign: 'left' })}
                        onPressedChange={() => editor.chain().focus().setTextAlign('left').run()}
                        aria-label="Align Left"
                    >
                        <AlignLeft className="h-4 w-4" />
                    </Toggle>
                    <Toggle
                        size="sm"
                        pressed={editor.isActive({ textAlign: 'center' })}
                        onPressedChange={() => editor.chain().focus().setTextAlign('center').run()}
                        aria-label="Align Center"
                    >
                        <AlignCenter className="h-4 w-4" />
                    </Toggle>
                    <Toggle
                        size="sm"
                        pressed={editor.isActive({ textAlign: 'right' })}
                        onPressedChange={() => editor.chain().focus().setTextAlign('right').run()}
                        aria-label="Align Right"
                    >
                        <AlignRight className="h-4 w-4" />
                    </Toggle>
                </div>

                <Separator orientation="vertical" className="h-6" />

                {/* Blocks */}
                <div className="flex items-center gap-2">
                    <Button
                        variant={editor.isActive('paragraph') ? 'secondary' : 'ghost'}
                        size="sm"
                        onClick={() => editor.chain().focus().setParagraph().run()}
                        title="Normal"
                    >
                        <Type className="h-4 w-4" />
                    </Button>
                    <Button
                        variant={editor.isActive('heading', { level: 1 }) ? 'secondary' : 'ghost'}
                        size="sm"
                        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                        className="font-bold text-lg"
                    >
                        H1
                    </Button>
                    <Button
                        variant={editor.isActive('heading', { level: 2 }) ? 'secondary' : 'ghost'}
                        size="sm"
                        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                        className="font-bold"
                    >
                        H2
                    </Button>
                </div>
            </div>

            {/* Error Display */}
            {error && (
                <Alert variant="destructive" className="mx-4 mt-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {/* Editor Content */}
            <div className="flex-1 overflow-auto bg-gray-100 p-4 md:p-8 dark:bg-gray-900/50 flex justify-center">
                <DocumentScaler targetWidth={794}>
                    <div
                        className="bg-white shadow-2xl overflow-hidden"
                        style={{
                            width: '210mm',
                            minHeight: '297mm',
                            padding: '20mm',
                            boxSizing: 'border-box'
                        }}
                    >
                        <EditorContent editor={editor} />
                    </div>
                </DocumentScaler>
            </div>

            {/* Footer */}
            <div className="p-4 border-t bg-background flex justify-between items-center z-20">
                <Button variant="outline" onClick={onCancel} disabled={isGenerating}>
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Start Over
                </Button>
                <Button
                    onClick={handleGeneratePDF}
                    disabled={isGenerating}
                    size="lg"
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                    {isGenerating ? (
                        <>
                            <Spinner className="mr-2 h-4 w-4" />
                            Generating PDF...
                        </>
                    ) : (
                        <>
                            Continue
                            <ChevronRight className="ml-2 h-4 w-4" />
                        </>
                    )}
                </Button>
            </div>
        </Card>
    )
}
