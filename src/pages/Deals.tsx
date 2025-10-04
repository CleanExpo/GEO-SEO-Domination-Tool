import { useMemo } from 'react'
import { format, parseISO } from 'date-fns'
import { useCRMStore } from '@/store/crmStore'
import type { Deal, DealStage } from '@/store/crmStore'

const stages: Array<{ id: DealStage; title: string; background: string }> = [
  { id: 'prospecting', title: 'Prospecting', background: 'bg-primary/5' },
  { id: 'qualification', title: 'Qualification', background: 'bg-primary/10' },
  { id: 'proposal', title: 'Proposal', background: 'bg-primary/15' },
  { id: 'negotiation', title: 'Negotiation', background: 'bg-primary/10' },
  { id: 'contract', title: 'Contract', background: 'bg-primary/5' },
  { id: 'closed-won', title: 'Closed Won', background: 'bg-emerald-500/10' },
  { id: 'closed-lost', title: 'Closed Lost', background: 'bg-rose-500/10' },
]

export default function Deals() {
  const deals = useCRMStore((state) => state.deals)
  const companies = useCRMStore((state) => state.companies)

  const groupedDeals = useMemo(() => {
    return stages.map((stage) => ({
      stage: stage.id,
      deals: deals.filter((deal) => deal.stage === stage.id),
    }))
  }, [deals])

  const currency = useMemo(
    () =>
      new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
      }),
    []
  )

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm uppercase tracking-wide text-muted-foreground">Pipeline Ops</p>
        <h1 className="text-2xl font-semibold text-foreground">Deals</h1>
        <p className="text-sm text-muted-foreground">
          Track every active opportunity and their velocity through your relationship pipeline.
        </p>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 overflow-x-auto">
        {stages.map((stageConfig) => {
          const bucket = groupedDeals.find((group) => group.stage === stageConfig.id)
          return (
            <div key={stageConfig.id} className="min-w-[260px]">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                  {stageConfig.title}
                </h2>
                <span className="text-xs text-muted-foreground">
                  {bucket?.deals.length ?? 0} deals
                </span>
              </div>
              <div className={space-y-3 rounded-xl p-3 border border-border }>
                {bucket?.deals.length ? (
                  bucket.deals.map((deal) => {
                    const company = companies.find((item) => item.id === deal.companyId)
                    return <DealCard key={deal.id} deal={deal} company={company?.name ?? 'Unknown'} currency={currency} />
                  })
                ) : (
                  <p className="text-xs text-muted-foreground">No deals in this stage.</p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function DealCard({
  deal,
  company,
  currency,
}: {
  deal: Deal
  company: string
  currency: Intl.NumberFormat
}) {
  return (
    <div className="bg-card border border-border/70 rounded-lg p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-foreground">{deal.name}</p>
          <p className="text-xs text-muted-foreground">{company}</p>
        </div>
        <span className="text-xs text-muted-foreground uppercase tracking-wide">{Math.round(deal.probability * 100)}%</span>
      </div>
      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
        <span>{currency.format(deal.value)}</span>
        <span>Close {format(parseISO(deal.expectedClose), 'MMM d')}</span>
      </div>
      <p className="mt-3 text-xs text-primary font-medium">Focus: {deal.focusArea}</p>
    </div>
  )
}
