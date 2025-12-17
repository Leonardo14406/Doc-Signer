/**
 * Download Step Component
 * 
 * Final step for downloading the signed PDF.
 */

'use client'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Download, RotateCcw, CheckCircle2 } from 'lucide-react'
import { downloadPdf, getOutputFilename } from '@/lib/utils'

// =============================================================================
// Types
// =============================================================================

interface DownloadStepProps {
    filename: string
    signedPdfBytes: Uint8Array
    onStartOver: () => void
}

// =============================================================================
// Component
// =============================================================================

export function DownloadStep({
    filename,
    signedPdfBytes,
    onStartOver,
}: DownloadStepProps) {
    const handleDownload = () => {
        const outputFilename = getOutputFilename(filename, '_signed')
        downloadPdf(signedPdfBytes, outputFilename)
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
                <p className="text-muted-foreground text-lg">
                    Your document has been signed and is ready to download
                </p>
            </div>

            <div className="max-w-md mx-auto space-y-4">
                <Button
                    size="lg"
                    onClick={handleDownload}
                    className="w-full gap-2 text-lg h-14"
                >
                    <Download className="w-6 h-6" />
                    Download Signed PDF
                </Button>

                <Button
                    variant="outline"
                    size="lg"
                    onClick={onStartOver}
                    className="w-full gap-2 text-lg h-14 bg-transparent"
                >
                    <RotateCcw className="w-6 h-6" />
                    Sign Another Document
                </Button>
            </div>

            <div className="mt-8 p-4 bg-muted/50 rounded-lg">
                <h3 className="font-medium mb-2 text-center">Security Notice</h3>
                <p className="text-sm text-muted-foreground text-center">
                    Your document was processed entirely in your browser. No data was sent to any server.
                </p>
            </div>
        </Card>
    )
}
