'use client'

export default function TestPublicPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="p-8 bg-black border border-white/10 rounded-lg">
        <h1 className="text-2xl font-bold text-white">Test Public Page</h1>
        <p className="text-white/70 mt-4">
          If you can see this, the middleware is not blocking this route.
        </p>
      </div>
    </div>
  )
} 