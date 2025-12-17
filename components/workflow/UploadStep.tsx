/**
 * Upload Step Component
 * 
 * Handles file upload UI with drag-and-drop support.
 * Shell component - delegates to useDocumentUpload hook.
 */

'use client'

import { useRef, useState, type DragEvent, type ChangeEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Upload, FileText, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Spinner } from '@/components/ui/spinner'
import { useDocumentUpload } from '@/hooks'

// =============================================================================
// Types
// =============================================================================

interface UploadStepProps {
    error: string | null
    progress: number
    onUploadComplete: (filename: string, htmlContent: string) => void
    onError: (error: string) => void
    onProgress: (progress: number) => void
}

// =============================================================================
// Component
// =============================================================================

export function UploadStep({
    error: externalError,
    progress: externalProgress,
    onUploadComplete,
    onError,
    onProgress,
}: UploadStepProps) {
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [isDragging, setIsDragging] = useState(false)
    const { upload, isUploading, error: uploadError } = useDocumentUpload()

    const displayError = externalError || uploadError

    const handleDrag = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        e.stopPropagation()
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setIsDragging(true)
        } else if (e.type === 'dragleave') {
            setIsDragging(false)
        }
    }

    const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(false)

        const files = Array.from(e.dataTransfer.files)
        if (files.length > 0) {
            await processFile(files[0])
        }
    }

    const handleFileInput = async (e: ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (files && files.length > 0) {
            await processFile(files[0])
        }
    }

    const processFile = async (file: File) => {
        onProgress(10)
        const result = await upload(file)

        if (result) {
            onUploadComplete(result.metadata.filename, result.html)
        } else if (uploadError) {
            onError(uploadError)
        }
    }

    return (
        <div className="space-y-8 text-center max-w-2xl mx-auto">
            <div className="space-y-4">
                <h1 className="text-4xl md:text-6xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
                    Sign Documents Fast.
                </h1>
                <p className="text-xl text-muted-foreground text-balance">
                    Securely edit, sign, and download your Word documents as PDFs. No registration required.
                </p>
            </div>

            <Card className="p-8">
                <div className="text-center mb-6">
                    <h2 className="text-2xl font-semibold mb-2">Upload Your Document</h2>
                    <p className="text-muted-foreground">Upload a .docx file to get started (max 10MB)</p>
                </div>

                {displayError && (
                    <Alert variant="destructive" className="mb-6">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{displayError}</AlertDescription>
                    </Alert>
                )}

                <div
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-lg p-12 text-center transition-all ${isDragging
                            ? 'border-primary bg-primary/5 scale-105'
                            : 'border-muted-foreground/25 hover:border-primary/50'
                        }`}
                >
                    {isUploading ? (
                        <div className="flex flex-col items-center gap-4">
                            <Spinner className="w-12 h-12" />
                            <p className="text-lg font-medium">Processing document...</p>
                            <p className="text-sm text-muted-foreground">Converting to editable format</p>
                        </div>
                    ) : (
                        <>
                            <div className="flex justify-center mb-4">
                                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                                    <Upload className="w-8 h-8 text-primary" />
                                </div>
                            </div>
                            <h3 className="text-lg font-semibold mb-2">Drop your .docx file here</h3>
                            <p className="text-muted-foreground mb-6">or</p>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".docx"
                                onChange={handleFileInput}
                                className="hidden"
                            />
                            <Button
                                size="lg"
                                onClick={() => fileInputRef.current?.click()}
                                className="gap-2"
                            >
                                <FileText className="w-5 h-5" />
                                Choose File
                            </Button>
                        </>
                    )}
                </div>
            </Card>
        </div>
    )
}
