"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ArrowRight, ZoomIn, ZoomOut, ChevronLeft, ChevronRight } from "lucide-react"
import { Spinner } from "@/components/ui/spinner"

interface DocumentPreviewProps {
  pdfBytes: Uint8Array
  fileName: string
  onContinue: () => void
}

export default function DocumentPreview({ pdfBytes, fileName, onContinue }: DocumentPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [scale, setScale] = useState(1.5)
  const [pageNum, setPageNum] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const pdfDocRef = useRef<any>(null)

  useEffect(() => {
    renderPDF()
  }, [pdfBytes, scale, pageNum])

  const renderPDF = async () => {
    setIsLoading(true)
    try {
      const pdfjsLib = await import("pdfjs-dist")

      // Set worker
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`

      // Use .slice() to create a copy because pdfjs-dist transfers ownership of the buffer
      const loadingTask = pdfjsLib.getDocument({ data: pdfBytes.slice() })
      const pdf = await loadingTask.promise
      pdfDocRef.current = pdf
      setTotalPages(pdf.numPages)

      const page = await pdf.getPage(pageNum)
      const viewport = page.getViewport({ scale })

      const canvas = canvasRef.current
      if (!canvas) return

      const context = canvas.getContext("2d")
      if (!context) return

      canvas.height = viewport.height
      canvas.width = viewport.width

      const renderContext = {
        canvasContext: context,
        viewport: viewport,
        canvas: null,
      }

      await page.render(renderContext).promise
    } catch (error) {
      console.error("Error rendering PDF:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="flex flex-col h-[80vh] overflow-hidden bg-background border-border shadow-2xl">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-3 border-b bg-muted/30 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setScale((s) => Math.max(0.5, s - 0.25))}
            disabled={scale <= 0.5}
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          <span className="text-sm text-muted-foreground px-2 min-w-[50px] text-center">{Math.round(scale * 100)}%</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setScale((s) => Math.min(3, s + 0.25))}
            disabled={scale >= 3}
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPageNum((p) => Math.max(1, p - 1))}
              disabled={pageNum <= 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm text-muted-foreground px-2">
              {pageNum} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPageNum((p) => Math.min(totalPages, p + 1))}
              disabled={pageNum >= totalPages}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Document Area - Full Width Like Editor */}
      <div className="flex-1 overflow-auto bg-gray-100 dark:bg-gray-900/50 flex justify-center p-8">
        {isLoading ? (
          <div className="flex flex-col items-center gap-4 py-12">
            <Spinner className="w-12 h-12" />
            <p className="text-muted-foreground">Rendering PDF...</p>
          </div>
        ) : (
          <canvas ref={canvasRef} className="shadow-lg bg-white" />
        )}
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t bg-background flex justify-end">
        <Button size="lg" onClick={onContinue} className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
          Continue to Sign
          <ArrowRight className="w-5 h-5" />
        </Button>
      </div>
    </Card>
  )
}
