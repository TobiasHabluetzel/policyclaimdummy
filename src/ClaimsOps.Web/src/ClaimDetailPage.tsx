import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

interface Claimant {
  firstName?: string | null
  lastName?: string | null
  dateOfBirth?: string | null
  email?: string | null
  phoneNumber?: string | null
}

interface Incident {
  description?: string | null
  incidentDate?: string | null
  incidentType?: string | null
}

interface Cost {
  id?: string | null
  date?: string | null
  classification?: string | null
  description?: string | null
  amount?: number | null
  currency?: string | null
  documentId?: string | null
  documentFilename?: string | null
  isCovered?: string | null
  coveredAmount?: number | null
  argumentation?: string | null
}

interface ReviewScenario {
  coverage?: string | null
  argumentation?: string | null
  customerWording?: string | null
  warnings?: string[] | null
}

interface Review {
  scenario?: ReviewScenario | null
}

interface ClaimDetail {
  shortCode: string
  acClaimId: string
  status: string
  createdAt: string
  reviewedAt?: string | null
  policyReference?: string | null
  productCode?: string | null
  currency?: string | null
  claimDate?: string | null
  claimant: Claimant
  incident: Incident
  costs?: Cost[] | null
  review?: Review | null
}

function formatMoney(amount?: number | null, currency?: string | null) {
  if (amount == null) return ''
  return `${currency ?? ''} ${amount.toFixed(2)}`.trim()
}

function statusBadge(status: string) {
  const cls = status === 'reviewed'
    ? 'bg-green-50 text-green-700 border-green-200'
    : status === 'submitted'
    ? 'bg-amber-50 text-amber-700 border-amber-200'
    : 'bg-slate-100 text-slate-600 border-slate-200'
  return <span className={`text-xs font-semibold uppercase tracking-wider px-2.5 py-1 rounded border ${cls}`}>{status}</span>
}

function coveredBadge(value?: string | null) {
  if (!value) return null
  const lower = value.toLowerCase()
  const cls = lower === 'yes' ? 'bg-green-50 text-green-700'
    : lower === 'no' ? 'bg-red-50 text-red-700'
    : 'bg-amber-50 text-amber-700'
  return <span className={`text-xs font-medium px-2 py-0.5 rounded ${cls}`}>{value}</span>
}

export function ClaimDetailPage() {
  const { shortCode } = useParams<{ shortCode: string }>()
  const [claim, setClaim] = useState<ClaimDetail | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!shortCode) return
    fetch(`/api/claims/${encodeURIComponent(shortCode)}`)
      .then(r => r.ok ? r.json() : Promise.reject(new Error(`${r.status}`)))
      .then(setClaim)
      .catch(e => setError(e instanceof Error ? e.message : 'Failed to load'))
  }, [shortCode])

  return (
    <div className="min-h-screen bg-co-surface font-sans text-slate-800">
      <header className="bg-white border-b border-co-line">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-co-slate text-white flex items-center justify-center font-bold">C</div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wide">Claims Operations</p>
              <h1 className="text-base font-semibold text-co-slate">Claim {shortCode}</h1>
            </div>
          </div>
          <a href="/" className="text-xs text-slate-500 hover:text-co-slate">← Back to inbox</a>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-5">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
            Failed to load claim {shortCode}: {error}
          </div>
        )}

        {!claim && !error && (
          <div className="text-sm text-slate-400">Loading…</div>
        )}

        {claim && <ClaimBody claim={claim} />}
      </main>
    </div>
  )
}

function ClaimBody({ claim }: { claim: ClaimDetail }) {
  const claimantName = [claim.claimant.firstName, claim.claimant.lastName].filter(Boolean).join(' ').trim()

  return (
    <>
      <div className="bg-white rounded-xl border border-co-line shadow-sm px-6 py-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{claim.shortCode}</p>
            <h2 className="text-lg font-semibold text-co-slate mt-1">
              {claim.policyReference ? `Policy ${claim.policyReference}` : 'Claim detail'}
            </h2>
          </div>
          {statusBadge(claim.status)}
        </div>
        {claim.reviewedAt && (
          <p className="text-xs text-slate-400 mt-2">
            Reviewed {new Date(claim.reviewedAt).toLocaleString('en-GB')}
          </p>
        )}
      </div>

      <Section title="Claimant">
        <Field label="Name">{claimantName || '—'}</Field>
        <Field label="Date of birth">{claim.claimant.dateOfBirth ?? '—'}</Field>
        <Field label="Email">{claim.claimant.email ?? '—'}</Field>
        <Field label="Phone">{claim.claimant.phoneNumber ?? '—'}</Field>
      </Section>

      <Section title="Incident">
        <Field label="Date">{claim.incident.incidentDate ?? '—'}</Field>
        <Field label="Type">{claim.incident.incidentType ?? '—'}</Field>
        {claim.incident.description && (
          <div className="col-span-2">
            <p className="text-xs text-slate-400 mb-1">Description</p>
            <p className="text-sm text-slate-700 leading-relaxed">{claim.incident.description}</p>
          </div>
        )}
      </Section>

      <ReviewPanel claim={claim} />

      {claim.costs && claim.costs.length > 0 && (
        <div className="bg-white rounded-xl border border-co-line shadow-sm px-6 py-5">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">Costs</h3>
          <div className="space-y-3">
            {claim.costs.map((cost, idx) => (
              <div key={cost.id ?? idx} className="border border-co-line rounded-lg px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-co-slate truncate">
                      {cost.description ?? cost.classification ?? 'Cost'}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {[cost.classification, cost.date].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-co-slate">
                      {formatMoney(cost.amount, cost.currency)}
                    </p>
                    <div className="mt-1">{coveredBadge(cost.isCovered)}</div>
                  </div>
                </div>
                {cost.documentFilename && (
                  <p className="text-xs text-slate-500 mt-2">
                    From{' '}
                    <a
                      href={`/api/claims/${encodeURIComponent(claim.shortCode)}/documents/${encodeURIComponent(cost.documentId ?? '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-co-blue underline"
                    >
                      {cost.documentFilename}
                    </a>
                  </p>
                )}
                {cost.argumentation && (
                  <p className="text-xs text-slate-500 mt-2 italic">{cost.argumentation}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {claim.status === 'submitted' && (
        <div className="bg-white rounded-xl border border-co-line shadow-sm px-6 py-5 text-sm text-slate-500">
          This claim is still being processed. Details will appear once the review is complete.
        </div>
      )}
    </>
  )
}

function coverageChip(label: string) {
  const lower = label.toLowerCase()
  const cls = lower.includes('covered') && !lower.includes('not')
      ? 'bg-green-50 text-green-700 border-green-200'
    : lower.includes('not covered') || lower === 'declined' || lower === 'rejected'
      ? 'bg-red-50 text-red-700 border-red-200'
    : 'bg-amber-50 text-amber-700 border-amber-200'
  return <span className={`inline-block text-xs font-semibold uppercase tracking-wider px-2.5 py-1 rounded border ${cls}`}>{label}</span>
}

function ReviewPanel({ claim }: { claim: ClaimDetail }) {
  const scenario = claim.review?.scenario
  const costs = claim.costs ?? []

  // Cost roll-up. We use the per-cost isCovered string AC writes
  // ("yes"/"no"/"partially") because review.costs is keyed by
  // classification rather than by individual cost line.
  const tally = costs.reduce(
    (acc, c) => {
      const k = (c.isCovered ?? '').toLowerCase()
      if (k === 'yes') acc.covered++
      else if (k === 'no') acc.notCovered++
      else if (k) acc.partial++
      else acc.unknown++
      acc.total += c.amount ?? 0
      if (k === 'yes') acc.coveredAmount += c.coveredAmount ?? c.amount ?? 0
      else if (k && k !== 'no') acc.coveredAmount += c.coveredAmount ?? 0
      return acc
    },
    { covered: 0, partial: 0, notCovered: 0, unknown: 0, total: 0, coveredAmount: 0 },
  )
  const currency = costs.find(c => c.currency)?.currency ?? claim.currency ?? ''

  const [showRationale, setShowRationale] = useState(false)
  const hasAnything = scenario?.coverage || scenario?.customerWording
    || scenario?.argumentation || (scenario?.warnings && scenario.warnings.length > 0)
    || costs.length > 0
  if (!hasAnything) return null

  const rollupParts: string[] = []
  if (tally.covered) rollupParts.push(`${tally.covered} covered`)
  if (tally.partial) rollupParts.push(`${tally.partial} partial`)
  if (tally.notCovered) rollupParts.push(`${tally.notCovered} not covered`)
  if (tally.unknown) rollupParts.push(`${tally.unknown} pending`)

  return (
    <div className="bg-white rounded-xl border border-co-line shadow-sm px-6 py-5">
      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">AC review</h3>

      {scenario?.coverage && <div className="mb-3">{coverageChip(scenario.coverage)}</div>}

      {scenario?.customerWording && (
        <p className="text-sm text-slate-700 leading-relaxed mb-3">{scenario.customerWording}</p>
      )}

      {costs.length > 0 && (
        <div className="text-xs text-slate-500 mb-3">
          {rollupParts.join(' · ')}
          {tally.total > 0 && (
            <> — <span className="text-slate-700 font-medium">{currency} {tally.coveredAmount.toFixed(2)}</span> covered of {currency} {tally.total.toFixed(2)}</>
          )}
        </div>
      )}

      {scenario?.warnings && scenario.warnings.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3">
          <p className="text-xs font-semibold text-amber-800 mb-1">Caveats</p>
          <ul className="text-xs text-amber-800 space-y-0.5 list-disc list-inside">
            {scenario.warnings.map((w, i) => <li key={i}>{w}</li>)}
          </ul>
        </div>
      )}

      {scenario?.argumentation && (
        <div>
          <button
            type="button"
            onClick={() => setShowRationale(s => !s)}
            className="text-xs text-co-blue hover:underline"
          >
            {showRationale ? 'Hide reviewer rationale' : 'Show reviewer rationale'}
          </button>
          {showRationale && (
            <p className="mt-2 text-xs text-slate-600 leading-relaxed whitespace-pre-line">{scenario.argumentation}</p>
          )}
        </div>
      )}
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-co-line shadow-sm px-6 py-5">
      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">{title}</h3>
      <div className="grid grid-cols-2 gap-x-4 gap-y-3">{children}</div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-slate-400 mb-0.5">{label}</p>
      <p className="text-sm font-medium text-slate-700">{children}</p>
    </div>
  )
}
