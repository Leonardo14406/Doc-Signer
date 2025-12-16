"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
    Bold,
    Italic,
    Underline,
    AlignLeft,
    AlignCenter,
    AlignRight,
    Type,
    ChevronRight,
    RotateCcw,
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Toggle } from "@/components/ui/toggle"
import { Separator } from "@/components/ui/separator"
import { Spinner } from "@/components/ui/spinner"

interface DocumentEditorProps {
    initialHtml: string
    onContinue: (pdfBytes: Uint8Array) => void
    onCancel: () => void
}

export default function DocumentEditor({ initialHtml, onContinue, onCancel }: DocumentEditorProps) {
    const [content, setContent] = useState(initialHtml)
    const [isGenerating, setIsGenerating] = useState(false)
    const editorRef = useRef<HTMLDivElement>(null)

    // Initialize content
    useEffect(() => {
        if (editorRef.current) {
            editorRef.current.innerHTML = initialHtml
        }
    }, [initialHtml])

    const execCommand = (command: string, value: string | undefined = undefined) => {
        document.execCommand(command, false, value)
        if (editorRef.current) {
            // Focus back on editor to keep selection
            // editorRef.current.focus() 
            // Actually execCommand usually requires focus, but let's ensure we track changes if needed
            setContent(editorRef.current.innerHTML)
        }
    }

    const handleGeneratePDF = async () => {
        setIsGenerating(true)
        try {
            const { jsPDF } = await import("jspdf")
            const html2canvas = (await import("html2canvas")).default

            const currentContent = editorRef.current?.innerHTML || ""

            // Create a hidden iframe to isolate styles
            const iframe = document.createElement("iframe")
            iframe.style.position = "absolute"
            iframe.style.top = "-9999px"
            iframe.style.left = "-9999px"
            iframe.style.width = "210mm"
            iframe.style.height = "auto"
            document.body.appendChild(iframe)

            const doc = iframe.contentWindow?.document
            if (!doc) throw new Error("Could not access iframe document")

            // Write HTML with pagination-aware CSS
            doc.open()
            doc.write(`
        <html>
          <head>
            <style>
              * { box-sizing: border-box; }
              body {
                margin: 0;
                padding: 0;
                font-family: Arial, sans-serif;
                font-size: 12pt;
                line-height: 1.6;
                color: #000;
                background: #fff;
              }
              /* A4 page container */
              .pdf-page {
                width: 210mm;
                min-height: 277mm; /* 297mm - 20mm margins */
                padding: 20mm;
                background: #fff;
                position: relative;
              }
              /* Content wrapper */
              .content-wrapper {
                width: 170mm;
              }
              /* Page break marker */
              .page-break-marker {
                page-break-after: always;
                break-after: page;
                height: 0;
                margin: 0;
                padding: 0;
              }
              /* Prevent splitting paragraphs */
              p, div:not(.pdf-page):not(.content-wrapper):not(.page-break-marker), 
              table, ul, ol, blockquote, h1, h2, h3, h4, h5, h6 {
                break-inside: avoid;
                page-break-inside: avoid;
              }
              /* Keep headings with following content */
              h1, h2, h3, h4, h5, h6 {
                break-after: avoid;
                page-break-after: avoid;
              }
              img { max-width: 100%; }
              table { width: 100%; border-collapse: collapse; }
              td, th { border: 1px solid #ccc; padding: 4px; }
            </style>
          </head>
          <body>
            <div class="content-wrapper">
              ${currentContent}
            </div>
          </body>
        </html>
      `)
            doc.close()

            // Wait for images to load
            await new Promise((resolve) => {
                const images = doc.images
                if (images.length === 0) return resolve(true)
                let loaded = 0
                const check = () => {
                    loaded++
                    if (loaded === images.length) resolve(true)
                }
                for (let i = 0; i < images.length; i++) {
                    if (images[i].complete) loaded++
                    else {
                        images[i].onload = check
                        images[i].onerror = check
                    }
                }
                if (loaded === images.length) resolve(true)
            })

            // Get all block-level elements for smart pagination
            const contentWrapper = doc.querySelector('.content-wrapper')
            if (!contentWrapper) throw new Error("Content wrapper not found")

            // PDF dimensions in mm
            const pageWidth = 210
            const pageHeight = 297
            const marginTop = 20
            const marginBottom = 20
            const marginLeft = 20
            const contentWidth = pageWidth - marginLeft * 2
            const usableHeight = pageHeight - marginTop - marginBottom

            // PDF setup
            const pdf = new jsPDF({
                orientation: "portrait",
                unit: "mm",
                format: "a4",
            })

            // Scale factor: pixels to mm (assuming 96 DPI)
            const pxPerMm = 3.779527559 // 96 DPI / 25.4mm per inch

            // Track current Y position on page
            let currentY = marginTop
            let isFirstPage = true

            // Get all direct children of content wrapper
            const elements = contentWrapper.children

            for (let i = 0; i < elements.length; i++) {
                const element = elements[i] as HTMLElement

                // Check for explicit page break
                if (element.classList.contains('page-break-marker')) {
                    if (!isFirstPage || currentY > marginTop) {
                        pdf.addPage()
                        currentY = marginTop
                    }
                    continue
                }

                // Render element to canvas
                const canvas = await html2canvas(element, {
                    scale: 2,
                    useCORS: true,
                    logging: false,
                    backgroundColor: "#ffffff",
                    width: contentWidth * pxPerMm,
                })

                const imgData = canvas.toDataURL("image/png")
                const imgWidth = contentWidth
                const imgHeight = (canvas.height / canvas.width) * contentWidth

                // Check if element fits on current page
                if (currentY + imgHeight > pageHeight - marginBottom) {
                    // Element doesn't fit - add new page
                    pdf.addPage()
                    currentY = marginTop
                    isFirstPage = false
                }

                // Add element to PDF
                pdf.addImage(imgData, "PNG", marginLeft, currentY, imgWidth, imgHeight)
                currentY += imgHeight
            }

            // Clean up
            document.body.removeChild(iframe)

            const pdfBytes = pdf.output("arraybuffer")
            onContinue(new Uint8Array(pdfBytes))

        } catch (error) {
            console.error("PDF Gen Error:", error)
            alert("Failed to generate PDF. Please try again.")
        } finally {
            setIsGenerating(false)
        }
    }

    return (
        <Card className="flex flex-col h-[80vh] overflow-hidden bg-background border-border shadow-2xl">
            {/* Toolbar */}
            <div className="flex items-center gap-2 p-2 border-b bg-muted/30 flex-wrap">
                <div className="flex items-center gap-1">
                    <Toggle size="sm" aria-label="Bold" onClick={() => execCommand("bold")}>
                        <Bold className="h-4 w-4" />
                    </Toggle>
                    <Toggle size="sm" aria-label="Italic" onClick={() => execCommand("italic")}>
                        <Italic className="h-4 w-4" />
                    </Toggle>
                    <Toggle size="sm" aria-label="Underline" onClick={() => execCommand("underline")}>
                        <Underline className="h-4 w-4" />
                    </Toggle>
                </div>

                <Separator orientation="vertical" className="h-6" />

                <div className="flex items-center gap-1">
                    <Toggle size="sm" aria-label="Align Left" onClick={() => execCommand("justifyLeft")}>
                        <AlignLeft className="h-4 w-4" />
                    </Toggle>
                    <Toggle size="sm" aria-label="Align Center" onClick={() => execCommand("justifyCenter")}>
                        <AlignCenter className="h-4 w-4" />
                    </Toggle>
                    <Toggle size="sm" aria-label="Align Right" onClick={() => execCommand("justifyRight")}>
                        <AlignRight className="h-4 w-4" />
                    </Toggle>
                </div>

                <Separator orientation="vertical" className="h-6" />

                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => execCommand("formatBlock", "P")} title="Normal">
                        <Type className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => execCommand("formatBlock", "H1")} className="font-bold text-lg">H1</Button>
                    <Button variant="ghost" size="sm" onClick={() => execCommand("formatBlock", "H2")} className="font-bold">H2</Button>
                </div>
            </div>

            {/* Editor Area */}
            <div className="flex-1 overflow-auto bg-gray-100 p-8 dark:bg-gray-900/50 flex justify-center">
                <div
                    ref={editorRef}
                    contentEditable
                    className="bg-white text-black shadow-lg p-[20mm] w-[210mm] min-h-[297mm] outline-none"
                    style={{
                        lineHeight: "1.5",
                    }}
                    onInput={(e) => setContent(e.currentTarget.innerHTML)}
                />
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t bg-background flex justify-between items-center">
                <Button variant="outline" onClick={onCancel} disabled={isGenerating}>
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Start Over
                </Button>
                <Button onClick={handleGeneratePDF} disabled={isGenerating} size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90">
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
