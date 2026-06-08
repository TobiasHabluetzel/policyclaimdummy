import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

interface ClaimRow {
  shortCode: string
  acClaimId: string
  status: string
  createdAt: string
  reviewedAt?: string | null
  policyReference?: string | null
  claimDate?: string | null
  claimantName?: string | null
  claimantEmail?: string | null
}

interface ListResponse {
  total: number
  items: ClaimRow[]
}

interface Tab {
  key: string                // route param
  label: string
  status?: string            // server-side status filter (undefined = all)
}

// For the demo a claim only lands here once AC has finished reviewing it, so
// the Inbox tab maps to status=reviewed. The downstream tabs (In review /
// Approved / Paid) are placeholders for ops states we don't track yet.
const TABS: Tab[] = [
  { key: 'inbox',    label: 'Inbox',     status: 'reviewed' },
  { key: 'in-review',label: 'In review', status: 'in-review' },
  { key: 'approved', label: 'Approved',  status: 'approved' },
  { key: 'paid',     label: 'Paid',      status: 'paid' },
  { key: 'all',      label: 'All claims' },
]

function formatDate(iso?: string | null) {
  if (!iso) return '—'
  try { return new Date(iso).toLocaleDateString('en-GB') } catch { return iso }
}

function StatusBadge({ status }: { status: string }) {
  const cls = status === 'reviewed' ? 'bg-green-50 text-green-700 border-green-200'
    : status === 'submitted'        ? 'bg-amber-50 text-amber-700 border-amber-200'
    : 'bg-slate-100 text-slate-600 border-slate-200'
  return <span className={`text-xs font-medium px-2 py-0.5 rounded border ${cls}`}>{status}</span>
}

export default function InboxPage() {
  const { tab } = useParams<{ tab?: string }>()
  const navigate = useNavigate()
  const activeTab = useMemo(() => TABS.find(t => t.key === (tab ?? 'inbox')) ?? TABS[0], [tab])

  const [search, setSearch] = useState('')
  const [rows, setRows] = useState<ClaimRow[] | null>(null)
  const [total, setTotal] = useState(0)
  const [error, setError] = useState('')

  // Refetch on tab / search change. Debounce search a touch so each keystroke
  // doesn't fire a request.
  useEffect(() => {
    let cancelled = false
    const t = setTimeout(() => {
      const params = new URLSearchParams()
      if (activeTab.status) params.set('status', activeTab.status)
      if (search.trim()) params.set('search', search.trim())
      fetch(`/api/claims?${params.toString()}`)
        .then(r => r.ok ? r.json() : Promise.reject(new Error(`${r.status}`)))
        .then((r: ListResponse) => { if (!cancelled) { setRows(r.items); setTotal(r.total); setError('') } })
        .catch(e => { if (!cancelled) setError(e instanceof Error ? e.message : 'Failed') })
    }, 200)
    return () => { cancelled = true; clearTimeout(t) }
  }, [activeTab.key, search])

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
          {TABS.map(t => (
            <button
              key={t.key}
              type="button"
              onClick={() => navigate(t.key === 'inbox' ? '/' : `/${t.key}`)}
              className={`py-3 border-b-2 ${t.key === activeTab.key ? 'border-co-blue text-co-slate font-semibold' : 'border-transparent text-slate-500 hover:text-co-slate'}`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-semibold text-co-slate">{activeTab.label}</h2>
          <input
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search reference, email, claimant…"
            className="border border-co-line rounded-lg px-3 py-2 text-sm w-80 focus:outline-none focus:border-co-blue"
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
            Failed to load claims: {error}
          </div>
        )}

        {rows === null && !error && (
          <div className="text-sm text-slate-400">Loading…</div>
        )}

        {rows && rows.length === 0 && !error && (
          <div className="bg-white rounded-xl border border-co-line shadow-sm p-8 text-center text-sm text-slate-400">
            No claims in this view yet.
          </div>
        )}

        {rows && rows.length > 0 && (
          <div className="bg-white rounded-xl border border-co-line shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-co-surface text-xs text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Reference</th>
                  <th className="text-left px-4 py-3 font-medium">Claimant</th>
                  <th className="text-left px-4 py-3 font-medium">Policy</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                  <th className="text-left px-4 py-3 font-medium">Incident</th>
                  <th className="text-left px-4 py-3 font-medium">Received</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-co-line">
                {rows.map(c => (
                  <tr
                    key={c.shortCode}
                    onClick={() => navigate(`/claim/${encodeURIComponent(c.shortCode)}`)}
                    className="hover:bg-co-surface cursor-pointer"
                  >
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">{c.shortCode}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-co-slate truncate">{c.claimantName || '—'}</div>
                      {c.claimantEmail && <div className="text-xs text-slate-400 truncate">{c.claimantEmail}</div>}
                    </td>
                    <td className="px-4 py-3 text-slate-700">{c.policyReference || '—'}</td>
                    <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                    <td className="px-4 py-3 text-slate-700">{formatDate(c.claimDate)}</td>
                    <td className="px-4 py-3 text-slate-700">{formatDate(c.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {total > rows.length && (
              <div className="px-4 py-2 text-xs text-slate-400 border-t border-co-line">
                Showing {rows.length} of {total}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
