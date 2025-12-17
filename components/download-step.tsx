"use client"

/**
 * Download Step Component
 * 
 * Final step showing success message and download button.
 * Uses the download API to fetch the signed PDF.
 */

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Download, RotateCcw, CheckCircle2 } from "lucide-react"

// =============================================================================
// Types
// =============================================================================

interface DownloadStepProps {
  signedPdfId: string
  fileName: string
  onStartOver: () => void
}

// =============================================================================
// Component
// =============================================================================

export default function DownloadStep({ signedPdfId, fileName, onStartOver }: DownloadStepProps) {
  const handleDownload = () => {
    // Use the download API with the signed PDF ID
    const downloadFileName = fileName.replace(".docx", "_signed.pdf")
    const downloadUrl = `/api/download/${signedPdfId}?filename=${encodeURIComponent(downloadFileName)}`

    // Trigger download
    const link = document.createElement("a")
    link.href = downloadUrl
    link.download = downloadFileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <Card className="p-8">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
            <CheckCircle2 className="w-12 h-12 text-primary" />
          </div>
        </div>
        <h2 className="text-3xl font-semibold mb-2">Document Signed Successfully!</h2>
        <p className="text-muted-foreground text-lg">Your document has been signed and is ready to download</p>
      </div>

      <div className="max-w-md mx-auto space-y-4">
        <Button size="lg" onClick={handleDownload} className="w-full gap-2 text-lg h-14">
          <Download className="w-6 h-6" />
          Download Signed PDF
        </Button>

        <Button variant="outline" size="lg" onClick={onStartOver} className="w-full gap-2 text-lg h-14 bg-transparent">
          <RotateCcw className="w-6 h-6" />
          Sign Another Document
        </Button>
      </div>

      <div className="mt-8 p-4 bg-muted/50 rounded-lg">
        <h3 className="font-medium mb-2 text-center">Security Notice</h3>
        <p className="text-sm text-muted-foreground text-center">
          Your document is securely processed on our servers and automatically deleted after download.
        </p>
      </div>
    </Card>
  )
}
