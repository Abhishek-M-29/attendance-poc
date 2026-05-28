export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-xl rounded-lg border border-gray-100 bg-white p-10 shadow-sm">
        <h1 className="text-3xl font-semibold text-gray-900">Acharya Attendance System</h1>
        <p className="mt-3 text-base text-gray-600">
          Role-based attendance and event management for administrators, faculty, and students.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <a
            href="/login"
            className="inline-flex h-11 items-center justify-center rounded-md bg-gray-900 px-5 text-sm font-medium text-white hover:bg-gray-800"
          >
            Sign In
          </a>
          <a
            href="/dashboard"
            className="inline-flex h-11 items-center justify-center rounded-md border border-gray-200 px-5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Go to Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
