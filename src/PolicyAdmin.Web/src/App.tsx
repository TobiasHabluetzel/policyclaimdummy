export default function App() {
  return (
    <div className="min-h-screen bg-pa-panel font-sans text-gray-800 text-sm">
      <header className="bg-pa-navy text-white border-b-4 border-pa-steel">
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest text-white/70">Policy Administration</p>
            <h1 className="text-lg font-bold">Underwriting Console</h1>
          </div>
          <div className="text-xs text-white/70">v 3.14.2 · session: demo</div>
        </div>
      </header>

      <nav className="bg-white border-b border-pa-line">
        <div className="max-w-7xl mx-auto px-4 flex gap-0 text-xs">
          {['Policies', 'Insured', 'Coverages', 'Reports', 'Admin'].map((label, i) => (
            <a
              key={label}
              href="#"
              className={`px-4 py-2 border-r border-pa-line ${i === 0 ? 'bg-pa-panel font-bold text-pa-navy' : 'text-gray-600 hover:bg-pa-panel'}`}
            >
              {label}
            </a>
          ))}
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-4">
        <div className="bg-white border border-pa-line">
          <div className="bg-pa-panel border-b border-pa-line px-3 py-2 text-xs uppercase tracking-widest text-pa-navy font-bold">
            Policy Search
          </div>
          <div className="p-6 text-center text-gray-500 text-xs">
            The policy admin UI is being prepared. Next deploy lands the policy list, search and add-policy form.
          </div>
        </div>
      </main>

      <footer className="text-center text-xs text-gray-400 py-6">
        Policy Administration · demo build · © {new Date().getFullYear()}
      </footer>
    </div>
  )
}
