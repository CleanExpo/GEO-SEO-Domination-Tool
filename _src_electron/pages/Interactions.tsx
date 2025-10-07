import { useMemo } from 'react'
import { format, formatDistanceToNowStrict } from 'date-fns'
import { useCRMStore } from '@/store/crmStore'

export default function Interactions() {
  const interactions = useCRMStore((state) => state.interactions)
  const contacts = useCRMStore((state) => state.contacts)

  const sortedInteractions = useMemo(
    () => [...interactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [interactions]
  )

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm uppercase tracking-wide text-muted-foreground">Relationship Log</p>
        <h1 className="text-2xl font-semibold text-foreground">Interactions</h1>
        <p className="text-sm text-muted-foreground">
          Story of every call, email, and working session that keeps your partnerships moving.
        </p>
      </header>

      <div className="space-y-4">
        {sortedInteractions.map((interaction) => {
          const contact = contacts.find((person) => person.id === interaction.contactId)
          return (
            <div key={interaction.id} className="relative border border-border rounded-xl bg-card p-6">
              <span className="absolute left-0 top-6 -ml-[29px] h-3 w-3 rounded-full border-2 border-background bg-primary" />
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-wide font-semibold text-muted-foreground">
                    {interaction.type.toUpperCase()}
                  </p>
                  <h2 className="text-lg font-semibold text-foreground">
                    {contact ? contact.name : 'Unknown contact'}
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">{interaction.summary}</p>
                </div>
                <div className="text-right text-xs text-muted-foreground">
                  <p>{format(new Date(interaction.date), 'MMM d, yyyy • h:mm a')}</p>
                  <p>{formatDistanceToNowStrict(new Date(interaction.date), { addSuffix: true })}</p>
                  {interaction.sentiment ? (
                    <p className="mt-2 font-medium text-primary">Sentiment: {interaction.sentiment}</p>
                  ) : null}
                </div>
              </div>
              {interaction.followUp ? (
                <p className="mt-4 text-xs text-primary font-medium">
                  Next step: {interaction.followUp}
                </p>
              ) : null}
            </div>
          )
        })}
      </div>
    </div>
  )
}
