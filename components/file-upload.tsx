"use client"

import type React from "react"

import { useState, useRef, type DragEvent } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Upload, FileText, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Spinner } from "@/components/ui/spinner"

interface FileUploadProps {
  onFileProcessed: (file: File, htmlContent: string) => void
}

export default function FileUpload({ onFileProcessed }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

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
    setError(null)
    setIsProcessing(true)

    // Validate file type
    if (!file.name.endsWith(".docx")) {
      setError("Please upload a .docx file")
      setIsProcessing(false)
      return
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      setError("File size must be less than 10MB")
      setIsProcessing(false)
      return
    }

    try {
      // Import libraries dynamically
      const mammoth = await import("mammoth")

      // Convert .docx to HTML with page break handling
      const arrayBuffer = await file.arrayBuffer()

      // Configure mammoth with custom transformation rules
      const options = {
        styleMap: [
          // Mark page breaks with a special class
          "br[type='page'] => div.page-break-marker",
        ],
      }

      const result = await mammoth.convertToHtml({ arrayBuffer }, options as any)
      let html = result.value

      // Post-process: Insert page break markers if mammoth didn't catch them
      // Also wrap paragraphs with keep-together classes for better pagination
      html = html
        // Ensure paragraphs have break-inside styling
        .replace(/<p>/g, '<p style="break-inside: avoid; page-break-inside: avoid;">')
        // Handle any existing br tags that might be page breaks
        .replace(/<br\s*\/?>\s*<br\s*\/?>/g, '</p><div class="page-break-marker"></div><p style="break-inside: avoid;">')

      // Pass the HTML and original file to the parent
      onFileProcessed(file, html)
    } catch (err) {
      console.error("Error processing file:", err)
      setError("Failed to process the document. Please try again.")
    } finally {
      setIsProcessing(false)
    }
  }

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
        className={`border-2 border-dashed rounded-lg p-12 text-center transition-all ${isDragging ? "border-primary bg-primary/5 scale-105" : "border-muted-foreground/25 hover:border-primary/50"
          }`}
      >
        {isProcessing ? (
          <div className="flex flex-col items-center gap-4">
            <Spinner className="w-12 h-12" />
            <p className="text-lg font-medium">Processing document...</p>
            <p className="text-sm text-muted-foreground">Converting to PDF format</p>
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
            <input ref={fileInputRef} type="file" accept=".docx" onChange={handleFileInput} className="hidden" />
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
