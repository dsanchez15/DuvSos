import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const SECRET_KEY = process.env.JWT_SECRET || 'your-secret-key-change-it'
const key = new TextEncoder().encode(SECRET_KEY)

export async function middleware(request: NextRequest) {
    const session = request.cookies.get('session')?.value

    // Verify session
    let userId: string | null = null
    if (session) {
        try {
            const { payload } = await jwtVerify(session, key, {
                algorithms: ['HS256'],
            })
            userId = payload.userId as string
        } catch (error) {
            // Invalid token
        }
    }

    const isAuthPage = request.nextUrl.pathname.startsWith('/login')
    const isApiAuth = request.nextUrl.pathname.startsWith('/api/auth')
    const isPublicAsset = request.nextUrl.pathname.match(/\.(svg|png|jpg|jpeg|gif|webp)$/)

    // Allow public assets and auth API
    if (isPublicAsset || isApiAuth) {
        return NextResponse.next()
    }

    // Redirect authenticated users away from login page
    if (isAuthPage && userId) {
        return NextResponse.redirect(new URL('/', request.url))
    }

    // Redirect unauthenticated users to login page
    if (!userId && !isAuthPage) {
        return NextResponse.redirect(new URL('/login', request.url))
    }

    // Add userId header for API routes to use easily (optional, but helpful)
    const response = NextResponse.next()
    if (userId) {
        response.headers.set('x-user-id', userId)
    }

    return response
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
}
