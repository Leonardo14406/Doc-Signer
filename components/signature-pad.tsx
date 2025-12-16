"use client"

import type React from "react"

import { useRef, useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { RotateCcw, Check, Pen } from "lucide-react"
import { Spinner } from "@/components/ui/spinner"

interface SignaturePadProps {
  pdfBytes: Uint8Array
  onSignatureComplete: (signedPdf: Uint8Array) => void
}

interface PageData {
  pageNum: number
  width: number
  height: number
}

export default function SignaturePad({ pdfBytes, onSignatureComplete }: SignaturePadProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const pdfCanvasRefs = useRef<Map<number, HTMLCanvasElement>>(new Map())
  const signatureCanvasRefs = useRef<Map<number, HTMLCanvasElement>>(new Map())

  const [isDrawing, setIsDrawing] = useState(false)
  const [hasSignature, setHasSignature] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [pages, setPages] = useState<PageData[]>([])
  const [activePageNum, setActivePageNum] = useState<number | null>(null)

  const scale = 1.5
  const pdfDocRef = useRef<any>(null)

  // Render all PDF pages
  useEffect(() => {
    renderAllPages()
  }, [pdfBytes])

  const renderAllPages = async () => {
    setIsLoading(true)
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
      console.error("Error loading PDF:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Render individual page when canvas is available
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

  // Set PDF canvas ref and trigger render
  const setPdfCanvasRef = useCallback((pageNum: number) => (el: HTMLCanvasElement | null) => {
    if (el) {
      pdfCanvasRefs.current.set(pageNum, el)
      renderPage(pageNum, el)
    }
  }, [renderPage])

  // Set signature canvas ref and initialize
  const setSignatureCanvasRef = useCallback((pageNum: number, width: number, height: number) => (el: HTMLCanvasElement | null) => {
    if (el) {
      signatureCanvasRefs.current.set(pageNum, el)
      el.width = width
      el.height = height
    }
  }, [])

  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>, canvas: HTMLCanvasElement) => {
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

  const startDrawing = (pageNum: number) => (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
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

  const draw = (pageNum: number) => (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
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

  const clearSignature = () => {
    signatureCanvasRefs.current.forEach((canvas) => {
      const ctx = canvas.getContext("2d")
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
      }
    })
    setHasSignature(false)
  }

  const embedSignature = async () => {
    if (!hasSignature) return

    setIsProcessing(true)
    try {
      const { PDFDocument } = await import("pdf-lib")

      const pdfDoc = await PDFDocument.load(pdfBytes.slice())
      const pdfPages = pdfDoc.getPages()

      for (const [pageNum, signatureCanvas] of signatureCanvasRefs.current) {
        // Skip empty canvases
        const ctx = signatureCanvas.getContext("2d")
        if (!ctx) continue

        const imageData = ctx.getImageData(
          0,
          0,
          signatureCanvas.width,
          signatureCanvas.height
        )

        // Check if canvas actually has drawing
        const hasInk = imageData.data.some(alpha => alpha !== 0)
        if (!hasInk) continue

        const pngDataUrl = signatureCanvas.toDataURL("image/png")
        const pngBytes = await fetch(pngDataUrl).then(r => r.arrayBuffer())

        const pngImage = await pdfDoc.embedPng(pngBytes)

        const page = pdfPages[pageNum - 1]
        if (!page) continue

        const { width: pageWidth, height: pageHeight } = page.getSize()

        /**
         * KEY FIX:
         * pdf-lib origin is bottom-left
         * Canvas origin is top-left
         * So we must flip vertically
         */
        page.drawImage(pngImage, {
          x: 0,
          y: pageHeight - signatureCanvas.height,
          width: pageWidth,
          height: signatureCanvas.height,
        })
      }

      const signedPdfBytes = await pdfDoc.save()
      onSignatureComplete(signedPdfBytes)
    } catch (error) {
      console.error("Error embedding signature:", error)
    } finally {
      setIsProcessing(false)
    }
  }

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
        <Button variant="outline" size="sm" onClick={clearSignature} className="gap-2" disabled={!hasSignature}>
          <RotateCcw className="w-4 h-4" />
          Clear All
        </Button>
      </div>

      {/* Signing Area - All Pages */}
      <div
        ref={containerRef}
        className="bg-gray-100 dark:bg-gray-900/50 flex flex-col items-center gap-8 p-8"
      >
        {isLoading ? (
          <div className="flex flex-col items-center gap-4 py-12">
            <Spinner className="w-12 h-12" />
            <p className="text-muted-foreground">Loading document...</p>
          </div>
        ) : (
          pages.map((pageData) => (
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

                {/* Signature Overlay for this page */}
                <canvas
                  ref={setSignatureCanvasRef(pageData.pageNum, pageData.width, pageData.height)}
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
                <div className="w-full max-w-[210mm] border-t border-dashed border-muted-foreground/30 mt-4" />
              )}
            </div>
          ))
        )}
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t bg-background flex justify-between items-center sticky bottom-0">
        <p className="text-sm text-muted-foreground">
          {hasSignature ? "✓ Signature added" : "Draw your signature anywhere on the document"}
        </p>
        <Button
          size="lg"
          onClick={embedSignature}
          disabled={!hasSignature || isProcessing}
          className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {isProcessing ? (
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
