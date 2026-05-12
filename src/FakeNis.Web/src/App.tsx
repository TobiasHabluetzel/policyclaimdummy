export default function App() {
  return (
    <div className="min-h-screen bg-nis-panel font-sans text-gray-800 text-sm">
      <header className="bg-nis-navy text-white border-b-4 border-nis-steel">
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest text-white/70">National Insurance System</p>
            <h1 className="text-lg font-bold">Policy Administration</h1>
          </div>
          <div className="text-xs text-white/70">v 3.14.2 · session: demo</div>
        </div>
      </header>

      <nav className="bg-white border-b border-nis-line">
        <div className="max-w-7xl mx-auto px-4 flex gap-0 text-xs">
          {['Policies', 'Insured', 'Coverages', 'Reports', 'Admin'].map((label, i) => (
            <a
              key={label}
              href="#"
              className={`px-4 py-2 border-r border-nis-line ${i === 0 ? 'bg-nis-panel font-bold text-nis-navy' : 'text-gray-600 hover:bg-nis-panel'}`}
            >
              {label}
            </a>
          ))}
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-4">
        <div className="bg-white border border-nis-line">
          <div className="bg-nis-panel border-b border-nis-line px-3 py-2 text-xs uppercase tracking-widest text-nis-navy font-bold">
            Policy Search
          </div>
          <div className="p-6 text-center text-gray-500 text-xs">
            Policy admin UI is being prepared. The next deploy will land the policy list, search and add-policy form.
          </div>
        </div>
      </main>

      <footer className="text-center text-xs text-gray-400 py-6">
        NIS · demo build · backbone © {new Date().getFullYear()}
      </footer>
    </div>
  )
}
