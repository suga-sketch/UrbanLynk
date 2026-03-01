import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 flex items-center justify-center p-8">
      <div className="max-w-2xl text-center">
        <h1 className="text-5xl font-bold text-white mb-4">UrbanLynk</h1>
        <p className="text-xl text-slate-300 mb-12">
          Smart City Grievance Management & Operations Platform
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Link
            href="/kiosk"
            className="bg-gradient-to-b from-cyan-600 to-cyan-700 hover:from-cyan-500 hover:to-cyan-600 text-white p-12 rounded-lg font-bold text-2xl transition-all transform hover:scale-105 shadow-lg"
          >
            <div className="text-5xl mb-4">🏛️</div>
            <div>Citizen Kiosk</div>
            <p className="text-sm text-cyan-100 mt-2">Register & Track Issues</p>
          </Link>

          <Link
            href="/admin"
            className="bg-gradient-to-b from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700 text-white p-12 rounded-lg font-bold text-2xl transition-all transform hover:scale-105 shadow-lg"
          >
            <div className="text-5xl mb-4">📊</div>
            <div>Operations Center</div>
            <p className="text-sm text-slate-300 mt-2">Management Dashboard</p>
          </Link>
        </div>

        <div className="mt-12 text-slate-400 text-sm">
          <p>Connected Urban Systems • 2026</p>
        </div>
      </div>
    </main>
  );
}
