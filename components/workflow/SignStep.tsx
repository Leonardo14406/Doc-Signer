/**
 * Sign Step Component
 * 
 * PDF display with signature overlay functionality.
 * Shell component - uses useSignature hook.
 */

'use client'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { RotateCcw, Check, Pen } from 'lucide-react'
import { Spinner } from '@/components/ui/spinner'
import { useSignature } from '@/hooks'

// =============================================================================
// Types
// =============================================================================

interface SignStepProps {
    filename: string
    pdfBytes: Uint8Array
    onSignatureChange: (hasSignature: boolean) => void
    onComplete: (signedPdfBytes: Uint8Array) => void
}

// =============================================================================
// Component
// =============================================================================

export function SignStep({
    filename,
    pdfBytes,
    onSignatureChange,
    onComplete,
}: SignStepProps) {
    const {
        canvasRefs,
        hasSignature,
        setHasSignature,
        clearAll,
        embedSignatures,
        isEmbedding,
        error,
    } = useSignature()

    const handleComplete = async () => {
        const signedPdf = await embedSignatures(pdfBytes)
        if (signedPdf) {
            onComplete(signedPdf)
        }
    }

    const handleClear = () => {
        clearAll()
        onSignatureChange(false)
    }

    // TODO: Implement PDF rendering with pdfjs-dist
    // For now, this is a placeholder

    return (
        <Card className="flex flex-col overflow-visible bg-background border-border shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b bg-muted/30 sticky top-0 z-10">
                <div className="flex items-center gap-2">
                    <div className="h-8 w-8 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Pen className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-sm">Sign Your Document</h3>
                        <p className="text-xs text-muted-foreground">
                            Draw your signature directly on the document
                        </p>
                    </div>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClear}
                    className="gap-2"
                    disabled={!hasSignature}
                >
                    <RotateCcw className="w-4 h-4" />
                    Clear All
                </Button>
            </div>

            {/* Signing Area */}
            <div className="bg-gray-100 dark:bg-gray-900/50 flex flex-col items-center gap-8 p-8 min-h-[400px]">
                {/* PDF pages and signature canvases will be rendered here */}
                <div className="text-center text-muted-foreground">
                    <p>PDF viewer and signature canvas will be rendered here.</p>
                    <p className="text-sm">This is a scaffolding placeholder.</p>
                </div>
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t bg-background flex justify-between items-center sticky bottom-0">
                <p className="text-sm text-muted-foreground">
                    {hasSignature ? '✓ Signature added' : 'Draw your signature anywhere on the document'}
                </p>

                {error && (
                    <p className="text-sm text-destructive">{error}</p>
                )}

                <Button
                    size="lg"
                    onClick={handleComplete}
                    disabled={!hasSignature || isEmbedding}
                    className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
                >
                    {isEmbedding ? (
                        <>
                            <Spinner className="w-5 h-5" />
                            Processing...
                        </>
                    ) : (
                        <>
                            <Check className="w-5 h-5" />
                            Complete & Download
                        </>
                    )}
                </Button>
            </div>
        </Card>
    )
}
