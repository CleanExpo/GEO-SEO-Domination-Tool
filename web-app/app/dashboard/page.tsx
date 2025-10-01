export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">Total Audits</h3>
            <p className="text-3xl font-bold text-blue-600">0</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">Companies</h3>
            <p className="text-3xl font-bold text-green-600">0</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">Reports</h3>
            <p className="text-3xl font-bold text-purple-600">0</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button className="p-4 bg-blue-500 text-white rounded hover:bg-blue-600 transition">
              New Audit
            </button>
            <button className="p-4 bg-green-500 text-white rounded hover:bg-green-600 transition">
              Add Company
            </button>
            <button className="p-4 bg-purple-500 text-white rounded hover:bg-purple-600 transition">
              View Reports
            </button>
            <button className="p-4 bg-orange-500 text-white rounded hover:bg-orange-600 transition">
              Analytics
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
