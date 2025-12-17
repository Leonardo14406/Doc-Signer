/**
 * Edit Step Component
 * 
 * Document editor wrapper for content editing.
 * Shell component - will integrate with Tiptap editor.
 */

'use client'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ChevronRight, RotateCcw } from 'lucide-react'
import { Spinner } from '@/components/ui/spinner'
import { usePdfGeneration } from '@/hooks'
import { EditorProvider } from '@/components/editor/EditorProvider'
import { EditorToolbar } from '@/components/editor/EditorToolbar'
import { EditorContent } from '@/components/editor/EditorContent'

// =============================================================================
// Types
// =============================================================================

interface EditStepProps {
    filename: string
    initialHtml: string
    onContentChange: (htmlContent: string) => void
    onContinue: (pdfBytes: Uint8Array) => void
    onCancel: () => void
}

// =============================================================================
// Component
// =============================================================================

export function EditStep({
    filename,
    initialHtml,
    onContentChange,
    onContinue,
    onCancel,
}: EditStepProps) {
    const { generate, isGenerating, error } = usePdfGeneration()

    const handleContinue = async () => {
        // Get current HTML content from editor context
        // For now, using initialHtml as placeholder
        const pdfBytes = await generate(initialHtml)

        if (pdfBytes) {
            onContinue(pdfBytes)
        }
    }

    return (
        <div className="w-full">
            <div className="text-center mb-6">
                <h2 className="text-2xl font-semibold">Review & Edit</h2>
                <p className="text-muted-foreground">Make any necessary changes before converting to PDF.</p>
            </div>

            <EditorProvider initialContent={initialHtml} onChange={onContentChange}>
                <Card className="flex flex-col h-[80vh] overflow-hidden bg-background border-border shadow-2xl">
                    {/* Toolbar */}
                    <EditorToolbar />

                    {/* Editor Area */}
                    <EditorContent />

                    {/* Footer Actions */}
                    <div className="p-4 border-t bg-background flex justify-between items-center">
                        <Button variant="outline" onClick={onCancel} disabled={isGenerating}>
                            <RotateCcw className="mr-2 h-4 w-4" />
                            Start Over
                        </Button>

                        {error && (
                            <p className="text-sm text-destructive">{error}</p>
                        )}

                        <Button
                            onClick={handleContinue}
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
            </EditorProvider>
        </div>
    )
}
