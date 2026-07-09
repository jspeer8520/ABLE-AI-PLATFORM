'use client';

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900">Welcome to ABLE 🚀</h1>
        <p className="mt-2 text-gray-600">Your creator platform is ready.</p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <h3 className="font-semibold text-gray-900">Products</h3>
            <p className="text-3xl font-bold mt-2">0</p>
            <p className="text-sm text-gray-500 mt-1">Digital products</p>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <h3 className="font-semibold text-gray-900">Revenue</h3>
            <p className="text-3xl font-bold mt-2">$0</p>
            <p className="text-sm text-gray-500 mt-1">Total earned</p>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <h3 className="font-semibold text-gray-900">Customers</h3>
            <p className="text-3xl font-bold mt-2">0</p>
            <p className="text-sm text-gray-500 mt-1">Total customers</p>
          </div>
        </div>

        <div className="mt-8 bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h2 className="font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <a href="/profile" className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition">
              <span className="text-2xl">👤</span>
              <div>
                <p className="font-medium">Edit Profile</p>
                <p className="text-sm text-gray-500">Update your info</p>
              </div>
            </a>
            <a href="/billing" className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition">
              <span className="text-2xl">💳</span>
              <div>
                <p className="font-medium">Billing</p>
                <p className="text-sm text-gray-500">Manage your plan</p>
              </div>
            </a>
            <a href="/settings" className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition">
              <span className="text-2xl">⚙️</span>
              <div>
                <p className="font-medium">Settings</p>
                <p className="text-sm text-gray-500">App preferences</p>
              </div>
            </a>
            <a href="/inbox" className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition">
              <span className="text-2xl">📬</span>
              <div>
                <p className="font-medium">Inbox</p>
                <p className="text-sm text-gray-500">Your messages</p>
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
