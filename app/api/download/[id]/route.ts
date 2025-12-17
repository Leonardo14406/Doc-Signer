import { NextRequest, NextResponse } from 'next/server'
import { getFilePath } from '@/lib/storage'
import { createReadStream } from 'fs'
import { stat } from 'fs/promises'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const searchParams = request.nextUrl.searchParams
        const filename = searchParams.get('filename') || `document-${id}.pdf`

        // Validate ID format (simple UUID check)
        if (!/^[0-9a-fA-F-]{36}$/.test(id)) {
            return new NextResponse('Invalid ID', { status: 400 })
        }

        try {
            const filePath = getFilePath(id)

            // Check if file exists and get stats
            const stats = await stat(filePath)

            if (!stats.isFile()) {
                return new NextResponse('File not found', { status: 404 })
            }

            // Create a read stream
            const fileStream = createReadStream(filePath)

            // Return stream response
            // @ts-ignore: NextResponse supports Node streams but types might conflict
            return new NextResponse(fileStream, {
                headers: {
                    'Content-Type': 'application/pdf',
                    'Content-Disposition': `attachment; filename="${filename}"`,
                    'Content-Length': stats.size.toString(),
                },
            })
        } catch (err) {
            console.error('File reading failed:', err)
            return new NextResponse('File not found', { status: 404 })
        }
    } catch (error) {
        console.error('Download failed:', error)
        return new NextResponse('Internal Server Error', { status: 500 })
    }
}
