import { useEffect, useMemo, useState } from 'react'
import { COUNTRIES } from './countries'

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
  identityNumber?: string | null
}

interface InsuredInput {
  id: string | null
  firstName: string
  lastName: string
  dateOfBirth: string
  email: string
  phoneNumber: string
  identityNumber: string
}

type StatusFilter = 'all' | 'Active' | 'Expired' | 'Cancelled'

// ----- App ----------------------------------------------------------------

type Tab = 'policies' | 'insureds'

export default function App() {
  const [tab, setTab] = useState<Tab>('policies')
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
          <TabLink active={tab === 'policies'} onClick={() => setTab('policies')}>Policies</TabLink>
          <TabLink active={tab === 'insureds'} onClick={() => setTab('insureds')}>Insured</TabLink>
          {['Coverages', 'Reports', 'Admin'].map(label => (
            <span key={label} className="px-4 py-2 border-r border-pa-line text-gray-400">{label}</span>
          ))}
        </div>
      </nav>

      {tab === 'policies' && <PoliciesBody />}
      {tab === 'insureds' && <InsuredsBody />}

      <footer className="text-center text-xs text-gray-400 py-6">
        Policy Administration · demo build · © {new Date().getFullYear()}
      </footer>
    </div>
  )
}

function TabLink({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 border-r border-pa-line ${active ? 'bg-pa-panel font-bold text-pa-navy' : 'text-gray-600 hover:bg-pa-panel'}`}
    >
      {children}
    </button>
  )
}

function PoliciesBody() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [policies, setPolicies] = useState<PolicyRow[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [cancelTarget, setCancelTarget] = useState<PolicyRow | null>(null)
  const [detailId, setDetailId] = useState<string | null>(null)

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
    <>
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
                  <tr
                    key={p.id}
                    onClick={() => setDetailId(p.id)}
                    className="border-b border-pa-line hover:bg-pa-panel/60 cursor-pointer"
                  >
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
                    <Td className="text-right" onClick={e => e.stopPropagation()}>
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

      {showAdd && <AddPolicyDialog onClose={() => setShowAdd(false)} onCreated={() => { setShowAdd(false); load() }} />}
      {detailId && (
        <PolicyDetailDialog
          id={detailId}
          onClose={() => setDetailId(null)}
          onUpdated={() => load()}
        />
      )}
      {cancelTarget && (
        <ConfirmDialog
          title="Cancel policy"
          message={`Cancel policy ${cancelTarget.displayNumber}? This sets CancelledAt to today and cannot be undone.`}
          confirmLabel="Cancel policy"
          onConfirm={() => confirmCancel(cancelTarget)}
          onClose={() => setCancelTarget(null)}
        />
      )}
    </>
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
  return { id: null, firstName: '', lastName: '', dateOfBirth: '', email: '', phoneNumber: '', identityNumber: '' }
}

function insuredValid(i: InsuredInput): boolean {
  if (i.id) return true
  return !!(i.email && i.firstName && i.lastName && i.dateOfBirth)
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

  // Annual policies always run start + 1 year - 1 day. Keep periodEnd in
  // sync with periodStart automatically and hide the input.
  useEffect(() => {
    if (duration === 'Annual' && periodStart) {
      const [y, m, d] = periodStart.split('-').map(Number)
      const start = new Date(Date.UTC(y, m - 1, d))
      const end = new Date(start)
      end.setUTCFullYear(end.getUTCFullYear() + 1)
      end.setUTCDate(end.getUTCDate() - 1)
      setPeriodEnd(end.toISOString().slice(0, 10))
    }
  }, [duration, periodStart])

  // Country and region don't overlap — clear destination on duration switch
  // so an annual doesn't keep a stale country (or vice versa).
  useEffect(() => {
    if (duration === 'Annual' && destination && !ANNUAL_REGIONS.includes(destination)) {
      setDestination('')
    } else if (duration === 'SingleTrip' && ANNUAL_REGIONS.includes(destination)) {
      setDestination('')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [duration])

  function addExtra() { setExtras(prev => [...prev, emptyInsured()]) }
  function removeExtra(i: number) { setExtras(prev => prev.filter((_, j) => j !== i)) }
  function patchExtra(i: number, patch: Partial<InsuredInput>) {
    setExtras(prev => prev.map((e, j) => j === i ? { ...e, ...patch } : e))
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!periodStart || !periodEnd || !destination) {
      setError('Period and destination are required.')
      return
    }
    if (!insuredValid(holder)) {
      setError('Holder needs email + first name + last name + date of birth.')
      return
    }
    if (showExtras && extras.some(x => !insuredValid(x))) {
      setError('Every additional insured needs email + first name + last name + date of birth.')
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
            {duration === 'Annual' ? (
              <Field label="Period end (auto)">
                <input type="date" value={periodEnd} disabled className="border border-pa-line px-2 py-1 text-sm w-full bg-pa-panel text-gray-500" />
              </Field>
            ) : (
              <Field label="Period end">
                <input type="date" value={periodEnd} onChange={e => setPeriodEnd(e.target.value)} className="border border-pa-line px-2 py-1 text-sm w-full" />
              </Field>
            )}
            <Field label="Destination">
              <DestinationPicker duration={duration} value={destination} onChange={setDestination} />
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
              <InsuredEditor
                value={holder}
                onChange={patch => setHolder(prev => ({ ...prev, ...patch }))}
              />
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

// ----- Policy detail (view + edit) ----------------------------------------

interface PolicyDetail {
  id: string
  displayNumber: string
  tier: 'Bronze' | 'Silver' | 'Gold'
  tierName: string
  duration: 'SingleTrip' | 'Annual'
  type: 'Individual' | 'Family' | 'Business'
  periodStart: string
  periodEnd: string
  destination: string
  currencyCode: string
  cancelledAt: string | null
  status: 'Active' | 'Expired' | 'Cancelled'
  insureds: Array<InsuredOption & { isHolder: boolean }>
  coverages: Array<{ code: string; name: string; description: string; coverSum: number; deductibleSum: number | null }>
}

function PolicyDetailDialog({
  id, onClose, onUpdated,
}: { id: string; onClose: () => void; onUpdated: () => void }) {
  const [detail, setDetail] = useState<PolicyDetail | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [edit, setEdit] = useState<{
    tier: 'Bronze' | 'Silver' | 'Gold'
    duration: 'SingleTrip' | 'Annual'
    type: 'Individual' | 'Family' | 'Business'
    periodStart: string
    periodEnd: string
    destination: string
    currencyCode: string
    holder: InsuredInput
    extras: InsuredInput[]
  } | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    const r = await fetch(`/api/admin/policies/${id}`)
    const data = await r.json() as PolicyDetail
    setDetail(data)
  }

  useEffect(() => { load() /* eslint-disable-next-line */ }, [id])

  function startEdit() {
    if (!detail) return
    const holderRow = detail.insureds.find(i => i.isHolder)
    const otherRows = detail.insureds.filter(i => !i.isHolder)
    const toInput = (i: InsuredOption): InsuredInput => ({
      id: i.id,
      firstName: i.firstName,
      lastName: i.lastName,
      dateOfBirth: i.dateOfBirth,
      email: i.email,
      phoneNumber: i.phoneNumber ?? '',
      identityNumber: i.identityNumber ?? '',
    })
    setEdit({
      tier: detail.tier,
      duration: detail.duration,
      type: detail.type,
      periodStart: detail.periodStart,
      periodEnd: detail.periodEnd,
      destination: detail.destination,
      currencyCode: detail.currencyCode,
      holder: holderRow ? toInput(holderRow) : emptyInsured(),
      extras: otherRows.map(toInput),
    })
    setEditMode(true)
    setError(null)
  }

  // Recompute periodEnd for Annual policies in edit mode.
  useEffect(() => {
    if (!edit) return
    if (edit.duration === 'Annual' && edit.periodStart) {
      const [y, m, d] = edit.periodStart.split('-').map(Number)
      const start = new Date(Date.UTC(y, m - 1, d))
      const end = new Date(start)
      end.setUTCFullYear(end.getUTCFullYear() + 1)
      end.setUTCDate(end.getUTCDate() - 1)
      setEdit(prev => prev ? { ...prev, periodEnd: end.toISOString().slice(0, 10) } : prev)
    }
  }, [edit?.duration, edit?.periodStart])

  // Clear destination if it no longer fits the new duration's picker.
  useEffect(() => {
    if (!edit) return
    const isRegion = ANNUAL_REGIONS.includes(edit.destination)
    if (edit.duration === 'Annual' && edit.destination && !isRegion) {
      setEdit(prev => prev ? { ...prev, destination: '' } : prev)
    } else if (edit.duration === 'SingleTrip' && isRegion) {
      setEdit(prev => prev ? { ...prev, destination: '' } : prev)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [edit?.duration])

  async function save() {
    if (!edit) return
    setError(null)
    if (!edit.periodStart || !edit.periodEnd || !edit.destination) {
      setError('Period and destination are required.')
      return
    }
    if (!insuredValid(edit.holder)) {
      setError('Holder needs email + first name + last name + date of birth.')
      return
    }
    if (edit.type !== 'Individual' && edit.extras.some(x => !insuredValid(x))) {
      setError('Every additional insured needs email + first name + last name + date of birth.')
      return
    }
    setSaving(true)
    try {
      const body = {
        tier: edit.tier,
        duration: edit.duration,
        type: edit.type,
        periodStart: edit.periodStart,
        periodEnd: edit.periodEnd,
        destination: edit.destination,
        currencyCode: edit.currencyCode,
        holder: edit.holder,
        additionalInsureds: edit.type === 'Individual' ? [] : edit.extras,
      }
      const r = await fetch(`/api/admin/policies/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!r.ok) { setError(`Save failed: ${await r.text()}`); return }
      setEditMode(false)
      await load()
      onUpdated()
    } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 overflow-y-auto" onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="bg-white border border-pa-line w-full max-w-4xl">
        <div className="bg-pa-panel border-b border-pa-line px-3 py-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xs uppercase tracking-widest text-pa-navy font-bold">Policy</span>
            <span className="font-mono text-pa-navy">{detail?.displayNumber ?? '…'}</span>
            {detail && <StatusBadge status={detail.status} />}
          </div>
          <div className="flex items-center gap-2">
            {!editMode && detail && detail.status !== 'Cancelled' && (
              <button onClick={startEdit} className="text-xs uppercase tracking-wider px-3 py-1 border border-pa-navy bg-white text-pa-navy hover:bg-pa-panel">
                Edit
              </button>
            )}
            <button onClick={onClose} className="text-xs uppercase tracking-wider px-3 py-1 border border-pa-line bg-white hover:bg-pa-panel">
              Close
            </button>
          </div>
        </div>

        {!detail && <div className="p-8 text-center text-gray-400 text-sm">Loading…</div>}

        {detail && !editMode && (
          <div className="p-4 space-y-4 max-h-[80vh] overflow-y-auto">
            <SectionHeader>Policy</SectionHeader>
            <div className="grid grid-cols-3 gap-x-6 gap-y-2 border border-t-0 border-pa-line p-3 text-xs">
              <Detail label="Type">{detail.type}</Detail>
              <Detail label="Duration">{detail.duration === 'SingleTrip' ? 'Single trip' : 'Annual'}</Detail>
              <Detail label="Tier">{detail.tier} – {detail.tierName}</Detail>
              <Detail label="Period">{detail.periodStart} – {detail.periodEnd}</Detail>
              <Detail label="Destination">{detail.destination}</Detail>
              <Detail label="Currency">{detail.currencyCode}</Detail>
              {detail.cancelledAt && <Detail label="Cancelled at">{detail.cancelledAt}</Detail>}
            </div>

            <SectionHeader>Insured ({detail.insureds.length})</SectionHeader>
            <div className="border border-t-0 border-pa-line">
              <table className="w-full text-xs">
                <thead className="bg-pa-panel text-pa-navy border-b border-pa-line">
                  <tr>
                    <Th>Name</Th>
                    <Th>Date of birth</Th>
                    <Th>Email</Th>
                    <Th>Phone</Th>
                    <Th>Role</Th>
                  </tr>
                </thead>
                <tbody>
                  {detail.insureds.map(i => (
                    <tr key={i.id} className="border-b border-pa-line last:border-b-0">
                      <Td>{i.firstName} {i.lastName}</Td>
                      <Td>{i.dateOfBirth}</Td>
                      <Td>{i.email}</Td>
                      <Td>{i.phoneNumber ?? '—'}</Td>
                      <Td>{i.isHolder ? <strong className="text-pa-navy">Holder</strong> : 'Insured'}</Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <SectionHeader>Coverages ({detail.coverages.length})</SectionHeader>
            <div className="border border-t-0 border-pa-line max-h-72 overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="bg-pa-panel text-pa-navy border-b border-pa-line sticky top-0">
                  <tr>
                    <Th className="w-32">Code</Th>
                    <Th>Name</Th>
                    <Th className="text-right w-28">Cover sum</Th>
                    <Th className="text-right w-28">Deductible</Th>
                  </tr>
                </thead>
                <tbody>
                  {detail.coverages.map(c => (
                    <tr key={c.code} className="border-b border-pa-line last:border-b-0">
                      <Td className="font-mono text-gray-500">{c.code}</Td>
                      <Td>{c.name}</Td>
                      <Td className="text-right">{c.coverSum > 0 ? c.coverSum.toLocaleString() : '—'}</Td>
                      <Td className="text-right">{c.deductibleSum != null ? c.deductibleSum.toLocaleString() : '—'}</Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {detail && editMode && edit && (
          <div className="p-4 space-y-4 max-h-[80vh] overflow-y-auto">
            <div className="grid grid-cols-3 gap-3">
              <Field label="Type">
                <Select value={edit.type} onChange={v => setEdit(p => p ? { ...p, type: v as any } : p)}
                  options={[['Individual', 'Individual'], ['Family', 'Family'], ['Business', 'Business']]} />
              </Field>
              <Field label="Duration">
                <Select value={edit.duration} onChange={v => setEdit(p => p ? { ...p, duration: v as any } : p)}
                  options={[['SingleTrip', 'Single trip'], ['Annual', 'Annual']]} />
              </Field>
              <Field label="Tier">
                <Select value={edit.tier} onChange={v => setEdit(p => p ? { ...p, tier: v as any } : p)}
                  options={[['Bronze', 'Bronze'], ['Silver', 'Silver'], ['Gold', 'Gold']]} />
              </Field>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <Field label="Period start">
                <input type="date" value={edit.periodStart}
                  onChange={e => setEdit(p => p ? { ...p, periodStart: e.target.value } : p)}
                  className="border border-pa-line px-2 py-1 text-sm w-full" />
              </Field>
              {edit.duration === 'Annual' ? (
                <Field label="Period end (auto)">
                  <input type="date" value={edit.periodEnd} disabled className="border border-pa-line px-2 py-1 text-sm w-full bg-pa-panel text-gray-500" />
                </Field>
              ) : (
                <Field label="Period end">
                  <input type="date" value={edit.periodEnd}
                    onChange={e => setEdit(p => p ? { ...p, periodEnd: e.target.value } : p)}
                    className="border border-pa-line px-2 py-1 text-sm w-full" />
                </Field>
              )}
              <Field label="Destination">
                <DestinationPicker
                  duration={edit.duration}
                  value={edit.destination}
                  onChange={v => setEdit(p => p ? { ...p, destination: v } : p)}
                />
              </Field>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <Field label="Currency">
                <Select value={edit.currencyCode} onChange={v => setEdit(p => p ? { ...p, currencyCode: v } : p)}
                  options={[['CHF', 'CHF'], ['EUR', 'EUR'], ['USD', 'USD'], ['GBP', 'GBP']]} />
              </Field>
            </div>

            <section>
              <div className="bg-pa-panel border border-pa-line px-3 py-1 text-xs uppercase tracking-widest text-pa-navy font-bold">Holder</div>
              <div className="border border-t-0 border-pa-line p-3">
                <InsuredEditor
                  value={edit.holder}
                  onChange={patch => setEdit(p => p ? { ...p, holder: { ...p.holder, ...patch } } : p)}
                />
              </div>
            </section>

            {edit.type !== 'Individual' && (
              <section>
                <div className="bg-pa-panel border border-pa-line px-3 py-1 text-xs uppercase tracking-widest text-pa-navy font-bold flex items-center justify-between">
                  <span>Additional insured ({edit.extras.length})</span>
                  <button type="button"
                    onClick={() => setEdit(p => p ? { ...p, extras: [...p.extras, emptyInsured()] } : p)}
                    className="text-xs uppercase tracking-wider text-pa-navy underline">+ Add</button>
                </div>
                <div className="border border-t-0 border-pa-line">
                  {edit.extras.length === 0 && (
                    <div className="px-3 py-3 text-xs text-gray-400">No additional insured.</div>
                  )}
                  {edit.extras.map((e, i) => (
                    <div key={i} className="px-3 py-3 border-b border-pa-line last:border-b-0">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs uppercase tracking-wider text-gray-500">Insured {i + 1}</p>
                        <button type="button"
                          onClick={() => setEdit(p => p ? { ...p, extras: p.extras.filter((_, j) => j !== i) } : p)}
                          className="text-xs text-rose-600 underline">Remove</button>
                      </div>
                      <InsuredEditor
                        value={e}
                        onChange={patch => setEdit(p => p ? {
                          ...p,
                          extras: p.extras.map((x, j) => j === i ? { ...x, ...patch } : x),
                        } : p)}
                      />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {error && <div className="bg-rose-50 border border-rose-300 text-rose-700 text-xs px-3 py-2">{error}</div>}

            <div className="border-t border-pa-line pt-3 flex justify-end gap-2">
              <button onClick={() => { setEditMode(false); setEdit(null) }}
                className="text-xs uppercase tracking-wider px-3 py-1 border border-pa-line bg-white hover:bg-pa-panel">
                Discard
              </button>
              <button onClick={save} disabled={saving}
                className="text-xs uppercase tracking-wider px-3 py-1 border border-pa-navy bg-pa-navy text-white hover:bg-pa-steel disabled:opacity-50">
                {saving ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-pa-panel border border-pa-line px-3 py-1 text-xs uppercase tracking-widest text-pa-navy font-bold">
      {children}
    </div>
  )
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-widest text-gray-400">{label}</p>
      <p className="text-gray-800">{children}</p>
    </div>
  )
}

// Annual policies are sold by region bucket — a single country doesn't make
// sense when the policy runs for a year. Keep this list in sync with the
// seeder.
const ANNUAL_REGIONS = ['Europe', 'Europe and US', 'Worldwide']

function DestinationPicker({ duration, value, onChange }: {
  duration: 'SingleTrip' | 'Annual'
  value: string
  onChange: (v: string) => void
}) {
  if (duration === 'Annual') {
    return (
      <Select
        value={ANNUAL_REGIONS.includes(value) ? value : ''}
        onChange={onChange}
        options={[['', '— select region —'], ...ANNUAL_REGIONS.map(r => [r, r] as [string, string])]}
      />
    )
  }
  return <CountryCombobox value={value} onChange={onChange} />
}

function CountryCombobox({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false)
  const matches = useMemo(() => {
    const q = value.trim().toLowerCase()
    if (!q) return COUNTRIES.slice(0, 10)
    return COUNTRIES.filter(c => c.toLowerCase().includes(q)).slice(0, 12)
  }, [value])
  return (
    <div className="relative">
      <input
        value={value}
        onChange={e => { onChange(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder="start typing a country…"
        className="border border-pa-line px-2 py-1 text-sm w-full"
      />
      {open && matches.length > 0 && (
        <div className="absolute z-20 left-0 right-0 bg-white border border-pa-line max-h-56 overflow-y-auto">
          {matches.map(c => (
            <button
              type="button"
              key={c}
              onMouseDown={() => { onChange(c); setOpen(false) }}
              className="block w-full text-left px-3 py-1.5 text-xs hover:bg-pa-panel border-b border-pa-line"
            >
              {c}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function InsuredEditor({ value, onChange }: { value: InsuredInput; onChange: (v: Partial<InsuredInput>) => void }) {
  // Email-first flow:
  //   - As the user types, we hit the admin list endpoint for live matches.
  //   - Clicking a suggestion (or typing an exact email match) links to the
  //     existing Insured row.
  //   - When no link is set, name / DOB / phone / identity inputs are locked
  //     until at least something is typed in the email field — empty email
  //     means "we don't know who this person is yet".
  const [suggestions, setSuggestions] = useState<InsuredOption[]>([])
  const [showSuggest, setShowSuggest] = useState(false)

  useEffect(() => {
    const email = value.email.trim()
    if (email.length < 2) { setSuggestions([]); return }
    let cancelled = false
    const t = setTimeout(async () => {
      const r = await fetch(`/api/admin/insureds?search=${encodeURIComponent(email)}&take=8`)
      if (cancelled || !r.ok) return
      const data = await r.json() as { items: InsuredOption[] }
      // Auto-link on exact email match (so 'paste the full address' still works).
      const exact = data.items.find(x => x.email.toLowerCase() === email.toLowerCase())
      if (exact && value.id !== exact.id) {
        pick(exact)
        return
      }
      setSuggestions(data.items)
    }, 250)
    return () => { cancelled = true; clearTimeout(t) }
    // eslint-disable-next-line
  }, [value.email])

  function pick(o: InsuredOption) {
    onChange({
      id: o.id,
      firstName: o.firstName,
      lastName: o.lastName,
      dateOfBirth: o.dateOfBirth,
      email: o.email,
      phoneNumber: o.phoneNumber ?? '',
      identityNumber: o.identityNumber ?? '',
    })
    setShowSuggest(false)
    setSuggestions([])
  }

  function unlink() {
    onChange({ id: null, firstName: '', lastName: '', dateOfBirth: '', email: '', phoneNumber: '', identityNumber: '' })
    setSuggestions([])
  }

  const linked = !!value.id
  const emailHasContent = value.email.trim().length > 0
  const fieldsDisabled = !emailHasContent
  const inputClass = `border border-pa-line px-2 py-1 text-sm w-full ${fieldsDisabled ? 'bg-pa-panel text-gray-400' : ''}`

  return (
    <div className="space-y-2">
      <div className="relative">
        <Field label="Email">
          <input
            type="email"
            value={value.email}
            onChange={e => {
              if (linked) onChange({ id: null, email: e.target.value })
              else onChange({ email: e.target.value })
              setShowSuggest(true)
            }}
            onFocus={() => setShowSuggest(true)}
            onBlur={() => setTimeout(() => setShowSuggest(false), 150)}
            placeholder="person@example.com"
            className="border border-pa-line px-2 py-1 text-sm w-full"
          />
        </Field>
        {!linked && showSuggest && suggestions.length > 0 && (
          <div className="absolute z-20 left-0 right-0 bg-white border border-pa-line max-h-64 overflow-y-auto shadow-sm">
            {suggestions.map(s => (
              <button
                type="button"
                key={s.id}
                onMouseDown={() => pick(s)}
                className="block w-full text-left px-3 py-1.5 text-xs hover:bg-pa-panel border-b border-pa-line"
              >
                <div className="text-gray-800">{s.firstName} {s.lastName} <span className="text-gray-400">· born {s.dateOfBirth}</span></div>
                <div className="text-gray-500">{s.email}</div>
              </button>
            ))}
          </div>
        )}
      </div>

      {linked ? (
        <div className="border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs flex items-start justify-between gap-2">
          <div>
            <div className="text-emerald-800 font-semibold">Existing insured — linked</div>
            <div className="text-gray-700 mt-0.5">
              {value.firstName} {value.lastName} · born {value.dateOfBirth}
              {value.phoneNumber ? ` · ${value.phoneNumber}` : ''}
              {value.identityNumber ? ` · ID ${value.identityNumber}` : ''}
            </div>
          </div>
          <button type="button" onClick={unlink} className="text-xs text-rose-600 underline shrink-0">Unlink</button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <Field label="First name">
            <input disabled={fieldsDisabled} value={value.firstName}
              onChange={e => onChange({ firstName: e.target.value })} className={inputClass} />
          </Field>
          <Field label="Last name">
            <input disabled={fieldsDisabled} value={value.lastName}
              onChange={e => onChange({ lastName: e.target.value })} className={inputClass} />
          </Field>
          <Field label="Date of birth">
            <input type="date" disabled={fieldsDisabled} value={value.dateOfBirth}
              onChange={e => onChange({ dateOfBirth: e.target.value })} className={inputClass} />
          </Field>
          <Field label="Phone (optional)">
            <input disabled={fieldsDisabled} value={value.phoneNumber}
              onChange={e => onChange({ phoneNumber: e.target.value })} className={inputClass} />
          </Field>
          <Field label="Passport / ID number (optional)">
            <input disabled={fieldsDisabled} value={value.identityNumber}
              onChange={e => onChange({ identityNumber: e.target.value })} className={inputClass} />
          </Field>
        </div>
      )}
    </div>
  )
}

// ----- Insureds tab -------------------------------------------------------

interface InsuredRow {
  id: string
  firstName: string
  lastName: string
  dateOfBirth: string
  email: string
  phoneNumber: string | null
  identityNumber: string | null
  policyCount: number
}

interface InsuredDetail {
  id: string
  firstName: string
  lastName: string
  dateOfBirth: string
  email: string
  phoneNumber: string | null
  identityNumber: string | null
  createdAt: string
  policies: Array<{
    id: string
    displayNumber: string
    tier: string
    type: string
    duration: string
    periodStart: string
    periodEnd: string
    status: 'Active' | 'Expired' | 'Cancelled'
    isHolder: boolean
  }>
}

function InsuredsBody() {
  const [search, setSearch] = useState('')
  const [rows, setRows] = useState<InsuredRow[]>([])
  const [loading, setLoading] = useState(true)
  const [editId, setEditId] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    try {
      const u = new URL('/api/admin/insureds', window.location.origin)
      if (search.trim()) u.searchParams.set('search', search.trim())
      u.searchParams.set('take', '200')
      const r = await fetch(u)
      const data = await r.json()
      setRows(data.items ?? [])
    } finally { setLoading(false) }
  }

  useEffect(() => { load() /* eslint-disable-next-line */ }, [])
  useEffect(() => {
    const id = setTimeout(load, 300)
    return () => clearTimeout(id)
    // eslint-disable-next-line
  }, [search])

  return (
    <>
      <main className="max-w-7xl mx-auto px-4 py-4 space-y-3">
        <div className="bg-white border border-pa-line">
          <div className="bg-pa-panel border-b border-pa-line px-3 py-2 text-xs uppercase tracking-widest text-pa-navy font-bold">
            Insured Search
          </div>
          <div className="p-3 flex items-center gap-3 border-b border-pa-line">
            <label className="text-xs uppercase tracking-widest text-gray-500">Search</label>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="email, first name, last name…"
              className="border border-pa-line px-2 py-1 text-sm flex-1 outline-none focus:border-pa-navy"
            />
            <div className="text-xs text-gray-400">{rows.length} result{rows.length === 1 ? '' : 's'}</div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-pa-panel border-b border-pa-line text-pa-navy">
                <tr>
                  <Th>Name</Th>
                  <Th>Date of birth</Th>
                  <Th>Email</Th>
                  <Th>Phone</Th>
                  <Th className="text-center">Policies</Th>
                </tr>
              </thead>
              <tbody>
                {loading && <tr><td colSpan={5} className="p-4 text-center text-gray-400">Loading…</td></tr>}
                {!loading && rows.length === 0 && <tr><td colSpan={5} className="p-4 text-center text-gray-400">No insureds match.</td></tr>}
                {!loading && rows.map(r => (
                  <tr
                    key={r.id}
                    onClick={() => setEditId(r.id)}
                    className="border-b border-pa-line hover:bg-pa-panel/60 cursor-pointer"
                  >
                    <Td>{r.firstName} {r.lastName}</Td>
                    <Td>{r.dateOfBirth}</Td>
                    <Td className="text-gray-700">{r.email}</Td>
                    <Td>{r.phoneNumber ?? '—'}</Td>
                    <Td className="text-center">{r.policyCount}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {editId && (
        <InsuredDetailDialog
          id={editId}
          onClose={() => setEditId(null)}
          onUpdated={() => load()}
        />
      )}
    </>
  )
}

function InsuredDetailDialog({ id, onClose, onUpdated }: { id: string; onClose: () => void; onUpdated: () => void }) {
  const [detail, setDetail] = useState<InsuredDetail | null>(null)
  const [edit, setEdit] = useState<{
    firstName: string
    lastName: string
    dateOfBirth: string
    email: string
    phoneNumber: string
    identityNumber: string
  } | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    const r = await fetch(`/api/admin/insureds/${id}`)
    if (!r.ok) return
    const data = await r.json() as InsuredDetail
    setDetail(data)
    setEdit({
      firstName: data.firstName,
      lastName: data.lastName,
      dateOfBirth: data.dateOfBirth,
      email: data.email,
      phoneNumber: data.phoneNumber ?? '',
      identityNumber: data.identityNumber ?? '',
    })
  }

  useEffect(() => { load() /* eslint-disable-next-line */ }, [id])

  async function save() {
    if (!edit) return
    setError(null)
    if (!edit.firstName.trim() || !edit.lastName.trim() || !edit.email.trim() || !edit.dateOfBirth) {
      setError('First name, last name, date of birth and email are required.')
      return
    }
    setSaving(true)
    try {
      const r = await fetch(`/api/admin/insureds/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: edit.firstName.trim(),
          lastName: edit.lastName.trim(),
          dateOfBirth: edit.dateOfBirth,
          email: edit.email.trim(),
          phoneNumber: edit.phoneNumber.trim() || null,
          identityNumber: edit.identityNumber.trim() || null,
        }),
      })
      if (r.status === 409) {
        const body = await r.json().catch(() => ({})) as { error?: string }
        setError(body.error ?? 'Email already in use by another insured.')
        return
      }
      if (!r.ok) { setError(`Save failed: ${await r.text()}`); return }
      await load()
      onUpdated()
    } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 overflow-y-auto" onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="bg-white border border-pa-line w-full max-w-3xl">
        <div className="bg-pa-panel border-b border-pa-line px-3 py-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xs uppercase tracking-widest text-pa-navy font-bold">Insured</span>
            <span className="text-pa-navy">{detail ? `${detail.firstName} ${detail.lastName}` : '…'}</span>
          </div>
          <button onClick={onClose} className="text-xs uppercase tracking-wider px-3 py-1 border border-pa-line bg-white hover:bg-pa-panel">Close</button>
        </div>

        {!detail || !edit ? (
          <div className="p-8 text-center text-gray-400 text-sm">Loading…</div>
        ) : (
          <div className="p-4 space-y-4 max-h-[80vh] overflow-y-auto">
            <SectionHeader>Details</SectionHeader>
            <div className="border border-t-0 border-pa-line p-3 grid grid-cols-2 gap-3">
              <Field label="First name">
                <input value={edit.firstName} onChange={e => setEdit(p => p ? { ...p, firstName: e.target.value } : p)}
                  className="border border-pa-line px-2 py-1 text-sm w-full" />
              </Field>
              <Field label="Last name">
                <input value={edit.lastName} onChange={e => setEdit(p => p ? { ...p, lastName: e.target.value } : p)}
                  className="border border-pa-line px-2 py-1 text-sm w-full" />
              </Field>
              <Field label="Date of birth">
                <input type="date" value={edit.dateOfBirth} onChange={e => setEdit(p => p ? { ...p, dateOfBirth: e.target.value } : p)}
                  className="border border-pa-line px-2 py-1 text-sm w-full" />
              </Field>
              <Field label="Email">
                <input type="email" value={edit.email} onChange={e => setEdit(p => p ? { ...p, email: e.target.value } : p)}
                  className="border border-pa-line px-2 py-1 text-sm w-full" />
              </Field>
              <Field label="Phone (optional)">
                <input value={edit.phoneNumber} onChange={e => setEdit(p => p ? { ...p, phoneNumber: e.target.value } : p)}
                  className="border border-pa-line px-2 py-1 text-sm w-full" />
              </Field>
              <Field label="Passport / ID number (optional)">
                <input value={edit.identityNumber} onChange={e => setEdit(p => p ? { ...p, identityNumber: e.target.value } : p)}
                  className="border border-pa-line px-2 py-1 text-sm w-full" />
              </Field>
            </div>

            <SectionHeader>Policies ({detail.policies.length})</SectionHeader>
            <div className="border border-t-0 border-pa-line">
              {detail.policies.length === 0 && (
                <div className="px-3 py-3 text-xs text-gray-400">Not on any policy.</div>
              )}
              {detail.policies.length > 0 && (
                <table className="w-full text-xs">
                  <thead className="bg-pa-panel text-pa-navy border-b border-pa-line">
                    <tr>
                      <Th>Policy</Th>
                      <Th>Type</Th>
                      <Th>Tier</Th>
                      <Th>Period</Th>
                      <Th>Role</Th>
                      <Th>Status</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail.policies.map(p => (
                      <tr key={p.id} className="border-b border-pa-line last:border-b-0">
                        <Td className="font-mono">{p.displayNumber}</Td>
                        <Td>{p.type}</Td>
                        <Td>{p.tier}</Td>
                        <Td>{p.periodStart} – {p.periodEnd}</Td>
                        <Td>{p.isHolder ? <strong className="text-pa-navy">Holder</strong> : 'Insured'}</Td>
                        <Td><StatusBadge status={p.status} /></Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {error && <div className="bg-rose-50 border border-rose-300 text-rose-700 text-xs px-3 py-2">{error}</div>}

            <div className="border-t border-pa-line pt-3 flex justify-end gap-2">
              <button onClick={onClose} className="text-xs uppercase tracking-wider px-3 py-1 border border-pa-line bg-white hover:bg-pa-panel">Discard</button>
              <button onClick={save} disabled={saving} className="text-xs uppercase tracking-wider px-3 py-1 border border-pa-navy bg-pa-navy text-white hover:bg-pa-steel disabled:opacity-50">
                {saving ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
