import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="text-center space-y-6">
        <div className="text-6xl text-gray-300 font-bold mb-4">404</div>
        <h1 className="text-3xl font-bold text-gray-900">This page doesn't exist</h1>
        <p className="text-gray-500 max-w-sm mx-auto">
          The link you clicked might be broken, or the page may have been removed.
        </p>
        <Link
          href="/"
          className="inline-block bg-black text-white px-8 py-3 rounded-xl font-medium hover:bg-gray-800 transition"
        >
          Return Home
        </Link>
      </div>
    </main>
  )
}
