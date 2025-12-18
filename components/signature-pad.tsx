"use client"

/**
 * Signature Pad Component
 * 
 * Multi-page PDF viewer with signature/drawing overlay.
 * Uses hooks for signature embedding - no business logic embedded.
 */

import type React from "react"
import { useRef, useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { RotateCcw, Check, Pen, AlertCircle } from "lucide-react"
import { Spinner } from "@/components/ui/spinner"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useSignature } from "@/hooks"
import DocumentScaler from "@/components/ui/document-scaler"

// =============================================================================
// Types
// =============================================================================

interface SignaturePadProps {
  pdfId: string
  onSignatureComplete: (signedPdfId: string) => void
}

interface PageData {
  pageNum: number
  width: number
  height: number
}

// =============================================================================
// Component
// =============================================================================

export default function SignaturePad({ pdfId, onSignatureComplete }: SignaturePadProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const pdfCanvasRefs = useRef<Map<number, HTMLCanvasElement>>(new Map())

  const [isDrawing, setIsDrawing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [pages, setPages] = useState<PageData[]>([])
  const [activePageNum, setActivePageNum] = useState<number | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  const scale = 1.5
  const pdfDocRef = useRef<any>(null)

  // Use the signature hook for all signing logic
  const {
    canvasRefs: signatureCanvasRefs,
    hasSignature,
    setHasSignature,
    clearAll,
    embedSignatures,
    isEmbedding,
    error: signError
  } = useSignature()

  // =========================================================================
  // PDF Loading
  // =========================================================================

  // Fetch PDF from server and render
  useEffect(() => {
    loadPdf()
  }, [pdfId])

  const loadPdf = async () => {
    setIsLoading(true)
    setLoadError(null)

    try {
      // Fetch PDF from download API
      const response = await fetch(`/api/download/${pdfId}`)
      if (!response.ok) {
        throw new Error('Failed to load PDF')
      }

      const pdfBytes = await response.arrayBuffer()
      await renderAllPages(new Uint8Array(pdfBytes))
    } catch (error) {
      console.error('Error loading PDF:', error)
      setLoadError(error instanceof Error ? error.message : 'Failed to load PDF')
    } finally {
      setIsLoading(false)
    }
  }

  const renderAllPages = async (pdfBytes: Uint8Array) => {
    try {
      const pdfjsLib = await import("pdfjs-dist")
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`

      const loadingTask = pdfjsLib.getDocument({ data: pdfBytes.slice() })
      const pdf = await loadingTask.promise
      pdfDocRef.current = pdf

      const pageDataList: PageData[] = []
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum)
        const viewport = page.getViewport({ scale })
        pageDataList.push({
          pageNum,
          width: viewport.width,
          height: viewport.height
        })
      }

      setPages(pageDataList)
    } catch (error) {
      console.error("Error rendering PDF:", error)
      setLoadError('Failed to render PDF pages')
    }
  }

  // =========================================================================
  // Page Rendering
  // =========================================================================

  const renderPage = useCallback(async (pageNum: number, canvas: HTMLCanvasElement) => {
    if (!pdfDocRef.current) return

    try {
      const page = await pdfDocRef.current.getPage(pageNum)
      const viewport = page.getViewport({ scale })
      const context = canvas.getContext("2d")
      if (!context) return

      canvas.width = viewport.width
      canvas.height = viewport.height

      await page.render({ canvasContext: context, viewport, canvas: null }).promise
    } catch (error) {
      console.error(`Error rendering page ${pageNum}:`, error)
    }
  }, [scale])

  const setPdfCanvasRef = useCallback((pageNum: number) => (el: HTMLCanvasElement | null) => {
    if (el) {
      pdfCanvasRefs.current.set(pageNum, el)
      renderPage(pageNum, el)
    }
  }, [renderPage])

  // Ref callback now only stores the element reference
  const setSignatureCanvasRef = useCallback((pageNum: number, _width: number, _height: number) => (el: HTMLCanvasElement | null) => {
    if (el) {
      signatureCanvasRefs.current.set(pageNum, el)
    }
  }, [signatureCanvasRefs])

  // =========================================================================
  // Drawing Handlers
  // =========================================================================

  const getCoordinates = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>,
    canvas: HTMLCanvasElement
  ) => {
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height

    if ("touches" in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY
      }
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    }
  }

  const startDrawing = (pageNum: number) => (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    const canvas = signatureCanvasRefs.current.get(pageNum)
    if (!canvas) return

    setIsDrawing(true)
    setActivePageNum(pageNum)
    const { x, y } = getCoordinates(e, canvas)

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  const draw = (pageNum: number) => (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    if (!isDrawing || activePageNum !== pageNum) return

    const canvas = signatureCanvasRefs.current.get(pageNum)
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const { x, y } = getCoordinates(e, canvas)

    ctx.lineTo(x, y)
    ctx.strokeStyle = "#1a1a2e"
    ctx.lineWidth = 3
    ctx.lineCap = "round"
    ctx.lineJoin = "round"
    ctx.stroke()

    setHasSignature(true)
  }

  const stopDrawing = () => {
    setIsDrawing(false)
    setActivePageNum(null)
  }

  // =========================================================================
  // Signature Embedding
  // =========================================================================

  const handleComplete = async () => {
    if (!hasSignature) return

    // Use the hook to embed signatures via server action
    const signedPdfId = await embedSignatures(pdfId)

    if (signedPdfId) {
      onSignatureComplete(signedPdfId)
    }
  }

  // =========================================================================
  // Render
  // =========================================================================

  const error = loadError || signError

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
              {pages.length > 1
                ? `${pages.length} pages - Draw your signature on any page`
                : "Draw your signature directly on the document"
              }
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={clearAll}
          className="gap-2"
          disabled={!hasSignature || isEmbedding}
        >
          <RotateCcw className="w-4 h-4" />
          Clear All
        </Button>
      </div>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive" className="mx-4 mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Signing Area - All Pages */}
      <div
        ref={containerRef}
        className="bg-gray-100 dark:bg-gray-900/50 flex flex-col items-center gap-8 p-4 md:p-8 overflow-auto"
      >
        {isLoading ? (
          <div className="flex flex-col items-center gap-4 py-12">
            <Spinner className="w-12 h-12" />
            <p className="text-muted-foreground">Loading document...</p>
          </div>
        ) : (
          <DocumentScaler targetWidth={pages[0]?.width || 794}>
            <div className="flex flex-col items-center gap-8">
              {pages.map((pageData) => (
                <div key={pageData.pageNum} className="flex flex-col items-center gap-2">
                  {/* Page Number Label */}
                  <div className="text-sm text-muted-foreground font-medium">
                    Page {pageData.pageNum} of {pages.length}
                  </div>

                  {/* Page Container */}
                  <div
                    className="relative shadow-lg"
                    style={{
                      width: pageData.width,
                      height: pageData.height,
                    }}
                  >
                    {/* PDF Background */}
                    <canvas
                      ref={setPdfCanvasRef(pageData.pageNum)}
                      className="bg-white block"
                    />

                    {/* Signature Overlay */}
                    <canvas
                      ref={setSignatureCanvasRef(pageData.pageNum, pageData.width, pageData.height)}
                      width={pageData.width}
                      height={pageData.height}
                      onMouseDown={startDrawing(pageData.pageNum)}
                      onMouseMove={draw(pageData.pageNum)}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                      onTouchStart={startDrawing(pageData.pageNum)}
                      onTouchMove={draw(pageData.pageNum)}
                      onTouchEnd={stopDrawing}
                      className="absolute top-0 left-0 cursor-crosshair"
                      style={{
                        touchAction: "none",
                        width: pageData.width,
                        height: pageData.height,
                      }}
                    />
                  </div>

                  {/* Page Separator */}
                  {pageData.pageNum < pages.length && (
                    <div className="w-full border-t border-dashed border-muted-foreground/30 mt-4" />
                  )}
                </div>
              ))}
            </div>
          </DocumentScaler>
        )}
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t bg-background flex justify-between items-center sticky bottom-0">
        <p className="text-sm text-muted-foreground">
          {hasSignature ? "✓ Signature added" : "Draw your signature anywhere on the document"}
        </p>
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
