import { useMemo } from 'react'
import { format, parseISO } from 'date-fns'
import { useCRMStore } from '@/store/crmStore'

interface CalendarEvent {
  id: string
  date: string
  type: 'task' | 'interaction'
  title: string
  details?: string
  meta?: string
  contactId?: string
}

export default function Calendar() {
  const { tasks, interactions, contacts } = useCRMStore((state) => ({
    tasks: state.tasks,
    interactions: state.interactions,
    contacts: state.contacts,
  }))

  const events = useMemo<CalendarEvent[]>(() => {
    const taskEvents: CalendarEvent[] = tasks.map((task) => ({
      id: 	ask-,
      date: task.dueDate,
      type: 'task',
      title: task.title,
      details: task.notes,
      meta: task.priority.toUpperCase(),
      contactId: task.relatedContactId,
    }))

    const interactionEvents: CalendarEvent[] = interactions.map((interaction) => ({
      id: interaction-,
      date: interaction.date,
      type: 'interaction',
      title: interaction.summary,
      details: interaction.followUp,
      contactId: interaction.contactId,
    }))

    return [...taskEvents, ...interactionEvents]
  }, [tasks, interactions])

  const grouped = useMemo(() => {
    const record = new Map<string, CalendarEvent[]>()
    events.forEach((event) => {
      const dayKey = format(new Date(event.date), 'yyyy-MM-dd')
      const bucket = record.get(dayKey) ?? []
      bucket.push(event)
      record.set(dayKey, bucket)
    })
    return Array.from(record.entries())
      .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
      .map(([day, dayEvents]) => ({
        day,
        events: dayEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
      }))
  }, [events])

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm uppercase tracking-wide text-muted-foreground">Schedule</p>
        <h1 className="text-2xl font-semibold text-foreground">Calendar & Timeline</h1>
        <p className="text-sm text-muted-foreground">
          One scrollable view of upcoming work blocks, meetings, and commitments.
        </p>
      </header>

      <div className="space-y-5">
        {grouped.map((group) => (
          <div key={group.day} className="border border-border rounded-xl bg-card p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">
                {format(parseISO(group.day), 'EEEE, MMMM d')}
              </h2>
              <span className="text-xs text-muted-foreground">{group.events.length} items</span>
            </div>
            <div className="mt-4 space-y-3">
              {group.events.map((event) => {
                const contact = event.contactId
                  ? contacts.find((person) => person.id === event.contactId)
                  : undefined
                return (
                  <div
                    key={event.id}
                    className={order border-border/70 rounded-lg p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2 }
                  >
                    <div>
                      <p className="text-sm font-semibold text-foreground">{event.title}</p>
                      {event.details ? (
                        <p className="text-xs text-muted-foreground mt-1">{event.details}</p>
                      ) : null}
                    </div>
                    <div className="text-xs text-muted-foreground text-right">
                      <p>{format(new Date(event.date), 'h:mm a')}</p>
                      {contact ? <p>With {contact.name}</p> : null}
                      {event.type === 'task' ? (
                        <p className="font-medium text-primary">{event.meta ?? 'Action item'}</p>
                      ) : (
                        <p className="font-medium text-sky-600">Live touchpoint</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
