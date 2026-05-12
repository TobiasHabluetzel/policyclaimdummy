import { useEffect, useState } from 'react'

// ----- Types ---------------------------------------------------------------

interface PolicyRow {
  id: string
  displayNumber: string
  tier: 'Bronze' | 'Silver' | 'Gold'
  duration: 'SingleTrip' | 'Annual'
  type: 'Individual' | 'Family' | 'Business'
  periodStart: string
  periodEnd: string
  destination: string
  status: 'Active' | 'Expired' | 'Cancelled'
  holderName: string
  holderEmail: string | null
  insuredCount: number
}

interface InsuredOption {
  id: string
  firstName: string
  lastName: string
  dateOfBirth: string
  email: string
  phoneNumber: string | null
}

interface InsuredInput {
  id: string | null
  firstName: string
  lastName: string
  dateOfBirth: string
  email: string
  phoneNumber: string
}

type StatusFilter = 'all' | 'Active' | 'Expired' | 'Cancelled'

// ----- App ----------------------------------------------------------------

export default function App() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [policies, setPolicies] = useState<PolicyRow[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [cancelTarget, setCancelTarget] = useState<PolicyRow | null>(null)

  async function load() {
    setLoading(true)
    try {
      const u = new URL('/api/admin/policies', window.location.origin)
      if (search.trim()) u.searchParams.set('search', search.trim())
      if (statusFilter !== 'all') u.searchParams.set('status', statusFilter)
      u.searchParams.set('take', '200')
      const r = await fetch(u)
      const data = await r.json()
      setPolicies(data.items ?? [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() /* eslint-disable-next-line */ }, [])
  useEffect(() => {
    const id = setTimeout(load, 300)
    return () => clearTimeout(id)
    // eslint-disable-next-line
  }, [search, statusFilter])

  async function confirmCancel(p: PolicyRow) {
    await fetch(`/api/admin/policies/${p.id}/cancel`, { method: 'POST' })
    setCancelTarget(null)
    load()
  }

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

      <main className="max-w-7xl mx-auto px-4 py-4 space-y-3">
        <div className="bg-white border border-pa-line">
          <div className="bg-pa-panel border-b border-pa-line px-3 py-2 text-xs uppercase tracking-widest text-pa-navy font-bold flex items-center justify-between">
            <span>Policy Search</span>
            <button
              onClick={() => setShowAdd(true)}
              className="bg-pa-navy text-white text-xs uppercase tracking-wider px-3 py-1 border border-pa-navy hover:bg-pa-steel"
            >
              + New Policy
            </button>
          </div>
          <div className="p-3 flex items-center gap-3 border-b border-pa-line">
            <label className="text-xs uppercase tracking-widest text-gray-500">Search</label>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="policy number, email, name, destination…"
              className="border border-pa-line px-2 py-1 text-sm flex-1 outline-none focus:border-pa-navy"
            />
            <div className="flex items-center gap-2">
              {(['all', 'Active', 'Expired', 'Cancelled'] as StatusFilter[]).map(s => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`text-xs uppercase tracking-wider px-2 py-1 border ${statusFilter === s ? 'bg-pa-navy text-white border-pa-navy' : 'bg-white border-pa-line text-gray-600 hover:bg-pa-panel'}`}
                >
                  {s === 'all' ? 'All' : s}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-pa-panel border-b border-pa-line text-pa-navy">
                <tr>
                  <Th>Policy</Th>
                  <Th>Holder</Th>
                  <Th>Type</Th>
                  <Th>Tier</Th>
                  <Th>Duration</Th>
                  <Th>Period</Th>
                  <Th>Destination</Th>
                  <Th>Insured</Th>
                  <Th>Status</Th>
                  <Th className="text-right">Action</Th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr><td colSpan={10} className="p-4 text-center text-gray-400">Loading…</td></tr>
                )}
                {!loading && policies.length === 0 && (
                  <tr><td colSpan={10} className="p-4 text-center text-gray-400">No policies match.</td></tr>
                )}
                {!loading && policies.map(p => (
                  <tr key={p.id} className="border-b border-pa-line hover:bg-pa-panel/60">
                    <Td className="font-mono">{p.displayNumber}</Td>
                    <Td>
                      <div className="text-gray-800">{p.holderName}</div>
                      <div className="text-gray-400">{p.holderEmail}</div>
                    </Td>
                    <Td>{p.type}</Td>
                    <Td>{p.tier}</Td>
                    <Td>{p.duration === 'SingleTrip' ? 'Single trip' : 'Annual'}</Td>
                    <Td>{p.periodStart} – {p.periodEnd}</Td>
                    <Td>{p.destination}</Td>
                    <Td className="text-center">{p.insuredCount}</Td>
                    <Td><StatusBadge status={p.status} /></Td>
                    <Td className="text-right">
                      {p.status === 'Cancelled'
                        ? <span className="text-gray-300 text-xs">—</span>
                        : <button
                            onClick={() => setCancelTarget(p)}
                            className="text-xs uppercase tracking-wider text-pa-navy hover:text-pa-steel underline"
                          >Cancel</button>}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <footer className="text-center text-xs text-gray-400 py-6">
        Policy Administration · demo build · © {new Date().getFullYear()}
      </footer>

      {showAdd && <AddPolicyDialog onClose={() => setShowAdd(false)} onCreated={() => { setShowAdd(false); load() }} />}
      {cancelTarget && (
        <ConfirmDialog
          title="Cancel policy"
          message={`Cancel policy ${cancelTarget.displayNumber}? This sets CancelledAt to today and cannot be undone.`}
          confirmLabel="Cancel policy"
          onConfirm={() => confirmCancel(cancelTarget)}
          onClose={() => setCancelTarget(null)}
        />
      )}
    </div>
  )
}

// ----- Table helpers ------------------------------------------------------

function Th({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <th className={`text-left uppercase tracking-widest font-bold px-3 py-2 ${className}`}>{children}</th>
}
function Td({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-3 py-2 align-top ${className}`}>{children}</td>
}

function StatusBadge({ status }: { status: PolicyRow['status'] }) {
  const cls = status === 'Active'
    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
    : status === 'Expired'
      ? 'bg-gray-100 text-gray-600 border-gray-300'
      : 'bg-rose-100 text-rose-700 border-rose-300'
  return <span className={`text-xs uppercase tracking-wider px-2 py-0.5 border ${cls}`}>{status}</span>
}

// ----- Confirm dialog ----------------------------------------------------

function ConfirmDialog({
  title, message, confirmLabel, onConfirm, onClose,
}: { title: string; message: string; confirmLabel: string; onConfirm: () => void; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="bg-white border border-pa-line w-full max-w-md">
        <div className="bg-pa-panel border-b border-pa-line px-3 py-2 text-xs uppercase tracking-widest text-pa-navy font-bold">
          {title}
        </div>
        <div className="p-4 text-sm text-gray-700">{message}</div>
        <div className="border-t border-pa-line p-3 flex justify-end gap-2">
          <button onClick={onClose} className="text-xs uppercase tracking-wider px-3 py-1 border border-pa-line bg-white hover:bg-pa-panel">Close</button>
          <button onClick={onConfirm} className="text-xs uppercase tracking-wider px-3 py-1 border border-rose-600 bg-rose-600 text-white hover:bg-rose-700">{confirmLabel}</button>
        </div>
      </div>
    </div>
  )
}

// ----- Add policy dialog -------------------------------------------------

function emptyInsured(): InsuredInput {
  return { id: null, firstName: '', lastName: '', dateOfBirth: '', email: '', phoneNumber: '' }
}

function AddPolicyDialog({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [tier, setTier] = useState<'Bronze' | 'Silver' | 'Gold'>('Silver')
  const [duration, setDuration] = useState<'SingleTrip' | 'Annual'>('SingleTrip')
  const [type, setType] = useState<'Individual' | 'Family' | 'Business'>('Individual')
  const [periodStart, setPeriodStart] = useState('')
  const [periodEnd, setPeriodEnd] = useState('')
  const [destination, setDestination] = useState('')
  const [currencyCode, setCurrencyCode] = useState('CHF')
  const [holder, setHolder] = useState<InsuredInput>(emptyInsured())
  const [extras, setExtras] = useState<InsuredInput[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const showExtras = type !== 'Individual'

  function addExtra() { setExtras(prev => [...prev, emptyInsured()]) }
  function removeExtra(i: number) { setExtras(prev => prev.filter((_, j) => j !== i)) }
  function patchExtra(i: number, patch: Partial<InsuredInput>) {
    setExtras(prev => prev.map((e, j) => j === i ? { ...e, ...patch } : e))
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!holder.firstName || !holder.lastName || !holder.email || !holder.dateOfBirth || !periodStart || !periodEnd || !destination) {
      setError('Please fill in the required fields (holder name + DOB + email, period and destination).')
      return
    }
    setSaving(true)
    try {
      const body = {
        tier, duration, type,
        periodStart, periodEnd, destination, currencyCode,
        holder,
        additionalInsureds: showExtras ? extras : [],
      }
      const r = await fetch('/api/admin/policies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!r.ok) {
        const text = await r.text()
        setError(`Save failed: ${text}`)
        return
      }
      onCreated()
    } catch (err: any) {
      setError(err?.message ?? 'Unknown error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 overflow-y-auto" onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="bg-white border border-pa-line w-full max-w-3xl">
        <div className="bg-pa-panel border-b border-pa-line px-3 py-2 text-xs uppercase tracking-widest text-pa-navy font-bold">
          New Policy
        </div>
        <form onSubmit={submit} className="p-4 space-y-4">
          {/* Top row */}
          <div className="grid grid-cols-3 gap-3">
            <Field label="Type">
              <Select value={type} onChange={v => setType(v as any)}
                options={[['Individual', 'Individual'], ['Family', 'Family'], ['Business', 'Business']]} />
            </Field>
            <Field label="Duration">
              <Select value={duration} onChange={v => setDuration(v as any)}
                options={[['SingleTrip', 'Single trip'], ['Annual', 'Annual']]} />
            </Field>
            <Field label="Tier">
              <Select value={tier} onChange={v => setTier(v as any)}
                options={[['Bronze', 'Bronze'], ['Silver', 'Silver'], ['Gold', 'Gold']]} />
            </Field>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Field label="Period start">
              <input type="date" value={periodStart} onChange={e => setPeriodStart(e.target.value)} className="border border-pa-line px-2 py-1 text-sm w-full" />
            </Field>
            <Field label="Period end">
              <input type="date" value={periodEnd} onChange={e => setPeriodEnd(e.target.value)} className="border border-pa-line px-2 py-1 text-sm w-full" />
            </Field>
            <Field label="Destination">
              <input value={destination} onChange={e => setDestination(e.target.value)} className="border border-pa-line px-2 py-1 text-sm w-full" />
            </Field>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Field label="Currency">
              <Select value={currencyCode} onChange={v => setCurrencyCode(v)}
                options={[['CHF', 'CHF'], ['EUR', 'EUR'], ['USD', 'USD'], ['GBP', 'GBP']]} />
            </Field>
          </div>

          {/* Holder section */}
          <section>
            <div className="bg-pa-panel border border-pa-line px-3 py-1 text-xs uppercase tracking-widest text-pa-navy font-bold">
              Holder
            </div>
            <div className="border border-t-0 border-pa-line p-3">
              <InsuredEditor value={holder} onChange={setHolder} />
            </div>
          </section>

          {showExtras && (
            <section>
              <div className="bg-pa-panel border border-pa-line px-3 py-1 text-xs uppercase tracking-widest text-pa-navy font-bold flex items-center justify-between">
                <span>Additional insured ({extras.length})</span>
                <button type="button" onClick={addExtra} className="text-xs uppercase tracking-wider text-pa-navy underline">+ Add</button>
              </div>
              <div className="border border-t-0 border-pa-line">
                {extras.length === 0 && (
                  <div className="px-3 py-3 text-xs text-gray-400">No additional insured. Click + Add above.</div>
                )}
                {extras.map((e, i) => (
                  <div key={i} className="px-3 py-3 border-b border-pa-line last:border-b-0">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs uppercase tracking-wider text-gray-500">Insured {i + 1}</p>
                      <button type="button" onClick={() => removeExtra(i)} className="text-xs text-rose-600 underline">Remove</button>
                    </div>
                    <InsuredEditor value={e} onChange={v => patchExtra(i, v)} />
                  </div>
                ))}
              </div>
            </section>
          )}

          {error && <div className="bg-rose-50 border border-rose-300 text-rose-700 text-xs px-3 py-2">{error}</div>}

          <div className="border-t border-pa-line pt-3 flex justify-end gap-2">
            <button type="button" onClick={onClose} className="text-xs uppercase tracking-wider px-3 py-1 border border-pa-line bg-white hover:bg-pa-panel">Cancel</button>
            <button type="submit" disabled={saving} className="text-xs uppercase tracking-wider px-3 py-1 border border-pa-navy bg-pa-navy text-white hover:bg-pa-steel disabled:opacity-50">
              {saving ? 'Saving…' : 'Create policy'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-xs">
      <span className="block text-gray-500 uppercase tracking-widest mb-1">{label}</span>
      {children}
    </label>
  )
}

function Select({
  value, onChange, options,
}: { value: string; onChange: (v: string) => void; options: [string, string][] }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="border border-pa-line px-2 py-1 text-sm w-full bg-white"
    >
      {options.map(([v, label]) => <option key={v} value={v}>{label}</option>)}
    </select>
  )
}

function InsuredEditor({ value, onChange }: { value: InsuredInput; onChange: (v: Partial<InsuredInput>) => void }) {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<InsuredOption[]>([])
  const [showSuggest, setShowSuggest] = useState(false)

  useEffect(() => {
    if (!query.trim() || query.length < 2) { setSuggestions([]); return }
    let cancelled = false
    const id = setTimeout(async () => {
      const r = await fetch(`/api/admin/insureds/search?term=${encodeURIComponent(query)}`)
      if (cancelled) return
      const data = await r.json() as InsuredOption[]
      setSuggestions(data)
    }, 250)
    return () => { cancelled = true; clearTimeout(id) }
  }, [query])

  function pick(o: InsuredOption) {
    onChange({
      id: o.id,
      firstName: o.firstName,
      lastName: o.lastName,
      dateOfBirth: o.dateOfBirth,
      email: o.email,
      phoneNumber: o.phoneNumber ?? '',
    })
    setQuery(`${o.firstName} ${o.lastName} <${o.email}>`)
    setShowSuggest(false)
  }

  function clearLink() {
    onChange({ id: null })
    setQuery('')
  }

  return (
    <div className="space-y-2">
      <div className="relative">
        <Field label={value.id ? 'Existing insured (linked by id)' : 'Find existing insured (or fill new below)'}>
          <input
            value={query}
            onChange={e => { setQuery(e.target.value); setShowSuggest(true); if (value.id) onChange({ id: null }) }}
            onFocus={() => setShowSuggest(true)}
            onBlur={() => setTimeout(() => setShowSuggest(false), 150)}
            placeholder="search name or email…"
            className="border border-pa-line px-2 py-1 text-sm w-full"
          />
        </Field>
        {showSuggest && suggestions.length > 0 && (
          <div className="absolute z-10 left-0 right-0 bg-white border border-pa-line max-h-64 overflow-y-auto">
            {suggestions.map(s => (
              <button
                type="button"
                key={s.id}
                onMouseDown={() => pick(s)}
                className="block w-full text-left px-3 py-1.5 text-xs hover:bg-pa-panel border-b border-pa-line"
              >
                <div className="text-gray-800">{s.firstName} {s.lastName} <span className="text-gray-400">({s.dateOfBirth})</span></div>
                <div className="text-gray-500">{s.email}</div>
              </button>
            ))}
          </div>
        )}
        {value.id && (
          <button type="button" onClick={clearLink} className="text-xs text-rose-600 underline mt-1">Unlink and enter new</button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="First name">
          <input value={value.firstName} disabled={!!value.id} onChange={e => onChange({ firstName: e.target.value })} className="border border-pa-line px-2 py-1 text-sm w-full disabled:bg-pa-panel disabled:text-gray-500" />
        </Field>
        <Field label="Last name">
          <input value={value.lastName} disabled={!!value.id} onChange={e => onChange({ lastName: e.target.value })} className="border border-pa-line px-2 py-1 text-sm w-full disabled:bg-pa-panel disabled:text-gray-500" />
        </Field>
        <Field label="Date of birth">
          <input type="date" value={value.dateOfBirth} disabled={!!value.id} onChange={e => onChange({ dateOfBirth: e.target.value })} className="border border-pa-line px-2 py-1 text-sm w-full disabled:bg-pa-panel disabled:text-gray-500" />
        </Field>
        <Field label="Email">
          <input type="email" value={value.email} disabled={!!value.id} onChange={e => onChange({ email: e.target.value })} className="border border-pa-line px-2 py-1 text-sm w-full disabled:bg-pa-panel disabled:text-gray-500" />
        </Field>
        <Field label="Phone (optional)">
          <input value={value.phoneNumber} disabled={!!value.id} onChange={e => onChange({ phoneNumber: e.target.value })} className="border border-pa-line px-2 py-1 text-sm w-full disabled:bg-pa-panel disabled:text-gray-500" />
        </Field>
      </div>
    </div>
  )
}
