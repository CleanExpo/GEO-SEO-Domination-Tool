import { useMemo } from 'react'
import { format, parseISO } from 'date-fns'
import { useCRMStore } from '@/store/crmStore'
import type { CRMStore, Task, TaskStatus } from '@/store/crmStore'

const statusColumns: Array<{ id: TaskStatus; title: string; accent: string }> = [
  { id: 'todo', title: 'To Do', accent: 'border-dashed border-2 border-primary/40' },
  { id: 'in-progress', title: 'In Progress', accent: 'border border-primary/50 bg-primary/5' },
  { id: 'completed', title: 'Completed', accent: 'border border-emerald-500/50 bg-emerald-500/5' },
]

export default function Tasks() {
  const { tasks, updateTaskStatus, contacts, projects } = useCRMStore((state) => ({
    tasks: state.tasks,
    updateTaskStatus: state.updateTaskStatus,
    contacts: state.contacts,
    projects: state.projects,
  }))

  const groupedTasks = useMemo(() => {
    return statusColumns.map((column) => ({
      column: column.id,
      tasks: tasks.filter((task) => task.status === column.id),
    }))
  }, [tasks])

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm uppercase tracking-wide text-muted-foreground">Execution</p>
        <h1 className="text-2xl font-semibold text-foreground">Tasks</h1>
        <p className="text-sm text-muted-foreground">
          Drag-and-drop style focus board (select new status) for everything due across relationships and builds.
        </p>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {statusColumns.map((column) => {
          const bucket = groupedTasks.find((group) => group.column === column.id)
          return (
            <div key={column.id} className={ounded-xl p-4 border border-border bg-card }>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                  {column.title}
                </h2>
                <span className="text-xs text-muted-foreground">{bucket?.tasks.length ?? 0}</span>
              </div>
              <div className="space-y-3">
                {bucket?.tasks.length ? (
                  bucket.tasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      contacts={contacts}
                      projects={projects}
                      onStatusChange={(status) => updateTaskStatus(task.id, status)}
                    />
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground">Nothing here yet.</p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function TaskCard({
  task,
  contacts,
  projects,
  onStatusChange,
}: {
  task: Task
  contacts: CRMStore['contacts']
  projects: CRMStore['projects']
  onStatusChange: (status: TaskStatus) => void
}) {
  const contact = task.relatedContactId
    ? contacts.find((person) => person.id === task.relatedContactId)
    : undefined
  const project = task.relatedProjectId
    ? projects.find((item) => item.id === task.relatedProjectId)
    : undefined

  return (
    <div className="border border-border/70 bg-background rounded-lg p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-foreground">{task.title}</p>
          <p className="text-xs text-muted-foreground">Due {format(parseISO(task.dueDate), 'MMM d')}</p>
        </div>
        <select
          value={task.status}
          onChange={(event) => onStatusChange(event.target.value as TaskStatus)}
          className="text-xs bg-card border border-border rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary/40"
        >
          <option value="todo">To Do</option>
          <option value="in-progress">In Progress</option>
          <option value="completed">Done</option>
        </select>
      </div>
      <div className="mt-3 space-y-2 text-xs text-muted-foreground">
        {contact ? <p>With {contact.name}</p> : null}
        {project ? <p>Project: {project.name}</p> : null}
        {task.notes ? <p className="text-muted-foreground/90">Notes: {task.notes}</p> : null}
      </div>
    </div>
  )
}
