'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // প্রোডাকশনে Sentry বা অন্য কোনো টুলে এরর লগ করতে পারেন
    console.error(error)
  }, [error])

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 max-w-md w-full text-center space-y-6">
        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto text-3xl">
          !
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Something went wrong!</h2>
          <p className="text-gray-500 text-sm">
            We've encountered an unexpected error. Please try again.
          </p>
        </div>
        <button
          onClick={() => reset()}
          className="w-full bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 transition"
        >
          Try again
        </button>
      </div>
    </main>
  )
}
