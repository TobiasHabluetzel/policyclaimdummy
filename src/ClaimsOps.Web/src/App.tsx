export default function App() {
  return (
    <div className="min-h-screen bg-co-surface font-sans text-slate-800">
      <header className="bg-white border-b border-co-line">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-co-slate text-white flex items-center justify-center font-bold">C</div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wide">Claims Operations</p>
              <h1 className="text-base font-semibold text-co-slate">Operations Console</h1>
            </div>
          </div>
          <div className="text-xs text-slate-400">Signed in as <span className="text-slate-600 font-medium">demo.operator</span></div>
        </div>
      </header>

      <nav className="bg-white border-b border-co-line">
        <div className="max-w-7xl mx-auto px-6 flex gap-6 text-sm">
          {['Inbox', 'In review', 'Approved', 'Paid', 'All claims'].map((label, i) => (
            <a
              key={label}
              href="#"
              className={`py-3 border-b-2 ${i === 0 ? 'border-co-blue text-co-slate font-semibold' : 'border-transparent text-slate-500 hover:text-co-slate'}`}
            >
              {label}
            </a>
          ))}
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-co-slate">Inbox</h2>
          <input
            type="search"
            placeholder="Search reference, email…"
            className="border border-co-line rounded-lg px-3 py-2 text-sm w-72 focus:outline-none focus:border-co-blue"
          />
        </div>

        <div className="bg-white rounded-xl border border-co-line shadow-sm p-8 text-center text-sm text-slate-400">
          Claims operations console is being prepared. Next deploy lands the claim inbox, detail view and status pipeline.
        </div>
      </main>
    </div>
  )
}
