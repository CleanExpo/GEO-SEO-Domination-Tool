export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
      <div className="text-center text-white p-8">
        <h1 className="text-5xl font-bold mb-4">GEO-SEO Domination Tool</h1>
        <p className="text-xl mb-8">Advanced local SEO and GEO ranking analysis</p>
        <div className="flex gap-4 justify-center">
          <a
            href="/dashboard"
            className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition"
          >
            Go to Dashboard
          </a>
          <a
            href="/api/health"
            className="bg-transparent border-2 border-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition"
          >
            Check API Status
          </a>
        </div>
      </div>
    </div>
  );
}
