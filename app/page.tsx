export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-white">
      <div className="w-full max-w-xl rounded-xl border border-blue-100 bg-white p-10 shadow-lg shadow-blue-100/50">
        <h1 className="text-3xl font-semibold text-gray-900">Acharya Attendance System</h1>
        <p className="mt-3 text-base text-gray-600">
          Role-based attendance and event management for administrators, faculty, and students.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <a
            href="/login"
            className="inline-flex h-11 items-center justify-center rounded-lg bg-blue-600 px-5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 transition-colors"
          >
            Sign In
          </a>
          <a
            href="/dashboard"
            className="inline-flex h-11 items-center justify-center rounded-lg border border-blue-200 px-5 text-sm font-medium text-blue-700 hover:bg-blue-50 transition-colors"
          >
            Go to Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
