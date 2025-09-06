import { NextResponse } from 'next/server'

// Define public paths that don't require authentication
const publicPaths = ['/', '/signup', '/register', '/test-public']

export function middleware(request) {
  const path = request.nextUrl.pathname
  
  console.log('Middleware running for path:', path)
  console.log('Is public path:', publicPaths.includes(path))
  
  // Check if the current path is public
  const isPublicPath = publicPaths.includes(path)

  // Get the token from cookies
  const token = request.cookies.get('token')?.value
  const isAuthenticated = !!token
  
  console.log('Token exists:', !!token)

  // If path requires authentication and user is not authenticated, redirect to login
  if (!isPublicPath && !isAuthenticated) {
    console.log('Redirecting to login')
    return NextResponse.redirect(new URL('/', request.url))
  }

  // If user is authenticated and trying to access login or signup page, redirect to dashboard
  if ((path === '/' || path === '/signup') && isAuthenticated) {
    console.log('Redirecting to dashboard')
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // For all other cases, continue with the request
  console.log('Continuing with request')
  return NextResponse.next()
}

// Configure which routes middleware will run on
export const config = {
  matcher: [
    /*
     * Match all paths except:
     * 1. /api (API routes)
     * 2. /_next (Next.js internals)
     * 3. /static (inside public)
     * 4. /_vercel (Vercel internals)
     * 5. all files in public directory
     */
    '/((?!api|_next|_vercel|static|[\\w-]+\\.\\w+).*)',
  ],
} 