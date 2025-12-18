"use client"

/**
 * File Upload Component
 * 
 * Handles file selection and drag-drop for DOCX files.
 * Uses the useDocumentUpload hook for server-side processing.
 * This component ONLY handles UI - no business logic.
 */

import type React from "react"
import { useState, useRef, type DragEvent } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Upload, FileText, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Spinner } from "@/components/ui/spinner"
import { useDocumentUpload } from "@/hooks"

// =============================================================================
// Types
// =============================================================================

interface FileUploadProps {
  onFileProcessed: (file: File, htmlContent: string) => void
}

// =============================================================================
// Component
// =============================================================================

export default function FileUpload({ onFileProcessed }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Use the upload hook for server-side processing
  const { upload, isUploading, error, clearError } = useDocumentUpload()

  // =========================================================================
  // Event Handlers
  // =========================================================================

  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragging(true)
    } else if (e.type === "dragleave") {
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

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      await processFile(files[0])
    }
  }

  const processFile = async (file: File) => {
    clearError()

    // Use the hook to upload and process via API
    const result = await upload(file)

    if (result) {
      // Pass the HTML content to the parent
      onFileProcessed(file, result.html)
    }
  }

  // =========================================================================
  // Render
  // =========================================================================

  return (
    <Card className="p-8">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-semibold mb-2">Upload Your Document</h2>
        <p className="text-muted-foreground">Upload a .docx file to get started (max 10MB)</p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-12 text-center transition-all ${isDragging
            ? "border-primary bg-primary/5 scale-105"
            : "border-muted-foreground/25 hover:border-primary/50"
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
            <Button size="lg" onClick={() => fileInputRef.current?.click()} className="gap-2">
              <FileText className="w-5 h-5" />
              Choose File
            </Button>
          </>
        )}
      </div>
    </Card>
  )
}
