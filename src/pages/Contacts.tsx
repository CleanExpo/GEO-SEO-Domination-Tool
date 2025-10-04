import { useMemo, useState } from 'react'
import { formatDistanceToNowStrict, parseISO } from 'date-fns'
import { useCRMStore } from '@/store/crmStore'
import type { ContactStatus } from '@/store/crmStore'

const statusStyles: Record<ContactStatus, string> = {
  active: 'bg-emerald-500/15 text-emerald-600',
  onboarding: 'bg-sky-500/15 text-sky-600',
  'churn-risk': 'bg-rose-500/15 text-rose-600',
}

export default function Contacts() {
  const [tagFilter, setTagFilter] = useState<string>('all')
  const { contacts, companies } = useCRMStore((state) => ({
    contacts: state.contacts,
    companies: state.companies,
  }))

  const allTags = useMemo(() => {
    const tags = new Set<string>()
    contacts.forEach((contact) => contact.tags.forEach((tag) => tags.add(tag)))
    return ['all', ...Array.from(tags)]
  }, [contacts])

  const filteredContacts = useMemo(() => {
    if (tagFilter === 'all') {
      return contacts
    }
    return contacts.filter((contact) => contact.tags.includes(tagFilter))
  }, [contacts, tagFilter])

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-wide text-muted-foreground">Relationships</p>
          <h1 className="text-2xl font-semibold text-foreground">Contacts</h1>
          <p className="text-muted-foreground text-sm">
            Snapshot of every founder, operator, and collaborator you are supporting.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Filter by tag</label>
          <select
            value={tagFilter}
            onChange={(event) => setTagFilter(event.target.value)}
            className="bg-card border border-border text-sm rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            {allTags.map((tag) => (
              <option key={tag} value={tag}>
                {tag === 'all' ? 'All tags' : tag}
              </option>
            ))}
          </select>
        </div>
      </header>

      <div className="overflow-hidden border border-border rounded-xl">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-muted/40">
            <tr>
              <HeaderCell>Name & Company</HeaderCell>
              <HeaderCell>Role</HeaderCell>
              <HeaderCell>Status</HeaderCell>
              <HeaderCell>Tags</HeaderCell>
              <HeaderCell>Last Interaction</HeaderCell>
              <HeaderCell>Next Step</HeaderCell>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-card">
            {filteredContacts.map((contact) => {
              const company = contact.companyId
                ? companies.find((item) => item.id === contact.companyId)
                : undefined
              return (
                <tr key={contact.id} className="hover:bg-muted/20">
                  <BodyCell>
                    <div className="flex flex-col">
                      <span className="font-medium text-sm text-foreground">{contact.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {company ? company.name : 'Independent'}
                      </span>
                    </div>
                  </BodyCell>
                  <BodyCell>{contact.role}</BodyCell>
                  <BodyCell>
                    <span className={	ext-xs font-medium px-2.5 py-1 rounded-full uppercase tracking-wide }>
                      {contact.status.replace('-', ' ')}
                    </span>
                  </BodyCell>
                  <BodyCell>
                    <div className="flex flex-wrap gap-1">
                      {contact.tags.map((tag) => (
                        <span key={tag} className="text-[11px] px-2 py-1 rounded-full bg-muted text-muted-foreground">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </BodyCell>
                  <BodyCell>
                    {contact.lastInteraction ? (
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNowStrict(parseISO(contact.lastInteraction), { addSuffix: true })}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">No activity yet</span>
                    )}
                  </BodyCell>
                  <BodyCell>
                    {contact.nextStep ? (
                      <span className="text-xs text-primary font-medium">{contact.nextStep}</span>
                    ) : (
                      <span className="text-xs text-muted-foreground">No follow-up set</span>
                    )}
                  </BodyCell>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function HeaderCell({ children }: { children: React.ReactNode }) {
  return (
    <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
      {children}
    </th>
  )
}

function BodyCell({ children }: { children: React.ReactNode }) {
  return <td className="px-4 py-4 text-sm text-foreground align-top">{children}</td>
}
