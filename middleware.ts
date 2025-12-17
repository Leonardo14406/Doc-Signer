import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Simple in-memory rate limiter using Map
// Note: In a real distributed environment (Vercel, AWS Lambda), this Map
// is per-instance and not shared. Use Redis/KV for robust rate limiting.
const rateLimitMap = new Map<string, { count: number; lastReset: number }>()

// Configuration
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const MAX_REQUESTS = 20 // 20 requests per minute per IP

// Clean up old entries every minute
setInterval(() => {
    const now = Date.now()
    for (const [ip, data] of rateLimitMap.entries()) {
        if (now - data.lastReset > RATE_LIMIT_WINDOW) {
            rateLimitMap.delete(ip)
        }
    }
}, RATE_LIMIT_WINDOW)

export function middleware(request: NextRequest) {
    const response = NextResponse.next()

    // 1. Security Headers (CSP, X-Content-Type-Options, etc.)
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
    response.headers.set(
        'Content-Security-Policy',
        "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://unpkg.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; frame-src 'self' blob:;"
    )
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')

    // 2. Rate Limiting for API routes
    if (request.nextUrl.pathname.startsWith('/api/') || request.method === 'POST') {
        const ip = request.headers.get('x-forwarded-for') || 'unknown'
        const now = Date.now()

        let record = rateLimitMap.get(ip)

        if (!record || now - record.lastReset > RATE_LIMIT_WINDOW) {
            record = { count: 0, lastReset: now }
            rateLimitMap.set(ip, record)
        }

        record.count += 1

        if (record.count > MAX_REQUESTS) {
            return new NextResponse(
                JSON.stringify({ error: { message: 'Too many requests. Please try again later.' } }),
                { status: 429, headers: { 'Content-Type': 'application/json' } }
            )
        }
    }

    return response
}

export const config = {
    matcher: [
        // Match all API routes and pages
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
}
