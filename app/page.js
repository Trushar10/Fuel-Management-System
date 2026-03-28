export default function Home() {
  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 font-sans">
      <main className="flex w-full max-w-3xl flex-col items-center justify-between rounded-2xl bg-white px-16 py-32 shadow-sm sm:items-start">
        <h1 className="mb-2 text-2xl font-bold text-gray-900">Fuel Management Dashboard</h1>
        <p className="mb-6 text-gray-500">Add your first fuel entry to start tracking vehicle and driver performance.</p>
        <a
          href="/add"
          className="inline-flex items-center rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition-colors hover:bg-blue-700"
        >
          Add First Entry
        </a>
      </main>
    </div>
  );
}
