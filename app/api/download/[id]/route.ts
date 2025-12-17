import { NextRequest, NextResponse } from 'next/server'
import { readFile } from '@/lib/storage'
import path from 'path'

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
            const fileBuffer = await readFile(id)

            return new NextResponse(new Blob([new Uint8Array(fileBuffer)]), {
                headers: {
                    'Content-Type': 'application/pdf',
                    'Content-Disposition': `attachment; filename="${filename}"`,
                    'Content-Length': fileBuffer.length.toString(),
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
