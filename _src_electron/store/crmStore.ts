import { create } from 'zustand'

const generateId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return Math.random().toString(36).slice(2, 10)
}

export type ContactStatus = 'active' | 'onboarding' | 'churn-risk'
export type TaskStatus = 'todo' | 'in-progress' | 'completed'
export type TaskPriority = 'low' | 'medium' | 'high'
export type DealStage =
  | 'prospecting'
  | 'qualification'
  | 'proposal'
  | 'negotiation'
  | 'contract'
  | 'closed-won'
  | 'closed-lost'

export interface Contact {
  id: string
  name: string
  email: string
  role: string
  phone?: string
  location?: string
  companyId?: string
  tags: string[]
  status: ContactStatus
  lastInteraction?: string
  nextStep?: string
}

export interface Company {
  id: string
  name: string
  industry: string
  website?: string
  headquarters?: string
  notes?: string
  health: 'green' | 'yellow' | 'red'
  lastContact?: string
}

export interface Deal {
  id: string
  name: string
  companyId: string
  value: number
  stage: DealStage
  expectedClose: string
  probability: number
  owner: string
  focusArea: string
}

export interface Interaction {
  id: string
  contactId: string
  date: string
  type: 'call' | 'email' | 'meeting' | 'note'
  summary: string
  followUp?: string
  sentiment?: 'positive' | 'neutral' | 'concerned'
}

export interface Task {
  id: string
  title: string
  dueDate: string
  status: TaskStatus
  priority: TaskPriority
  owner: string
  relatedContactId?: string
  relatedProjectId?: string
  notes?: string
}

export interface CRMProject {
  id: string
  name: string
  owner: string
  category: string
  status: 'planning' | 'active' | 'blocked' | 'completed' | 'backlog'
  source: 'manual' | 'github'
  description?: string
  lastUpdated: string
  nextAction?: string
  repositoryUrl?: string
  externalId?: string
  language?: string
  stars?: number
  visibility?: 'public' | 'private'
}

export interface CRMStore {
  contacts: Contact[]
  companies: Company[]
  deals: Deal[]
  interactions: Interaction[]
  tasks: Task[]
  projects: CRMProject[]
  addImportedProjects: (projects: CRMProject[]) => void
  updateTaskStatus: (taskId: string, status: TaskStatus) => void
  updateDealStage: (dealId: string, stage: DealStage) => void
}

const initialCompanies: Company[] = [
  {
    id: 'acme-solutions',
    name: 'Acme Solutions',
    industry: 'SaaS Automation',
    website: 'https://acmesolutions.io',
    headquarters: 'Austin, TX',
    notes: 'High-growth automation studio focused on AI-assisted ops.',
    health: 'green',
    lastContact: '2025-01-02',
  },
  {
    id: 'northwind',
    name: 'Northwind Retail',
    industry: 'DTC',
    website: 'https://northwind.shop',
    headquarters: 'Portland, OR',
    notes: 'Scaling paid media, interested in AI-generated content workflows.',
    health: 'yellow',
    lastContact: '2024-12-28',
  },
  {
    id: 'vertex-dev',
    name: 'Vertex Dev Collective',
    industry: 'Product Studio',
    website: 'https://vertex.dev',
    headquarters: 'Remote',
    notes: 'Boutique shop collaborating on OSS integrations.',
    health: 'green',
    lastContact: '2025-01-07',
  },
]

const initialContacts: Contact[] = [
  {
    id: 'omar',
    name: 'Omar Choudhry',
    email: 'omar@5daysprint.com',
    role: 'Founder',
    phone: '+1 (512) 555-1042',
    location: 'Austin, TX',
    companyId: 'acme-solutions',
    tags: ['alpha client', 'builder'],
    status: 'active',
    lastInteraction: '2025-01-08',
    nextStep: 'Share weekly growth scorecard on Tuesday',
  },
  {
    id: 'olivia',
    name: 'Olivia Chen',
    email: 'olivia@northwind.shop',
    role: 'Head of Growth',
    phone: '+1 (971) 555-9921',
    location: 'Portland, OR',
    companyId: 'northwind',
    tags: ['retail', 'growth'],
    status: 'onboarding',
    lastInteraction: '2024-12-30',
    nextStep: 'Confirm Q1 launch milestones',
  },
  {
    id: 'marcus',
    name: 'Marcus Bell',
    email: 'marcus@vertex.dev',
    role: 'Product Lead',
    phone: '+1 (415) 555-2841',
    location: 'San Francisco, CA',
    companyId: 'vertex-dev',
    tags: ['partner', 'engineering'],
    status: 'active',
    lastInteraction: '2025-01-06',
    nextStep: 'Co-build GitHub sync automation brief',
  },
  {
    id: 'anika',
    name: 'Anika Rao',
    email: 'anika@acmesolutions.io',
    role: 'RevOps',
    companyId: 'acme-solutions',
    tags: ['ops'],
    status: 'active',
    lastInteraction: '2025-01-09',
    nextStep: 'Prep data room for renewal review',
  },
  {
    id: 'diego',
    name: 'Diego Alvarez',
    email: 'diego@northwind.shop',
    role: 'CX Lead',
    tags: ['customer success'],
    status: 'churn-risk',
    lastInteraction: '2024-12-18',
    nextStep: 'Schedule VOC workshop',
  },
]

const initialDeals: Deal[] = [
  {
    id: 'acme-renewal',
    name: 'Acme Annual Expansion',
    companyId: 'acme-solutions',
    value: 48000,
    stage: 'proposal',
    expectedClose: '2025-01-20',
    probability: 0.65,
    owner: 'You',
    focusArea: 'AI automation playbook',
  },
  {
    id: 'northwind-intelligence',
    name: 'Northwind Intelligence Suite',
    companyId: 'northwind',
    value: 36000,
    stage: 'negotiation',
    expectedClose: '2025-02-05',
    probability: 0.55,
    owner: 'You',
    focusArea: 'Lifecycle personalization',
  },
  {
    id: 'vertex-playbooks',
    name: 'Vertex Co-Build Retainer',
    companyId: 'vertex-dev',
    value: 54000,
    stage: 'qualification',
    expectedClose: '2025-02-18',
    probability: 0.4,
    owner: 'You',
    focusArea: 'Shared launch processes',
  },
  {
    id: 'acme-success-plan',
    name: 'Acme Success Plan Pilot',
    companyId: 'acme-solutions',
    value: 12000,
    stage: 'contract',
    expectedClose: '2025-01-15',
    probability: 0.75,
    owner: 'You',
    focusArea: 'Customer journey dashboard',
  },
]

const initialInteractions: Interaction[] = [
  {
    id: generateId(),
    contactId: 'omar',
    date: '2025-01-08T15:00:00Z',
    type: 'meeting',
    summary: 'Sprint review: aligned next steps on automation rollout.',
    followUp: 'Send updated KPI tracker',
    sentiment: 'positive',
  },
  {
    id: generateId(),
    contactId: 'marcus',
    date: '2025-01-06T19:00:00Z',
    type: 'call',
    summary: 'Drafted GitHub import workflow; need final repo access list.',
    followUp: 'Share access template',
    sentiment: 'neutral',
  },
  {
    id: generateId(),
    contactId: 'diego',
    date: '2024-12-18T17:30:00Z',
    type: 'email',
    summary: 'Support backlog concerns; prepping CX workshop.',
    followUp: 'Book VOC workshop for week of Jan 13',
    sentiment: 'concerned',
  },
]

const initialTasks: Task[] = [
  {
    id: generateId(),
    title: 'Finalize Acme renewal proposal',
    dueDate: '2025-01-13',
    status: 'in-progress',
    priority: 'high',
    owner: 'You',
    relatedContactId: 'omar',
    notes: 'Highlight automation impact + adoption metrics.',
  },
  {
    id: generateId(),
    title: 'Plan Northwind lifecycle workshop',
    dueDate: '2025-01-17',
    status: 'todo',
    priority: 'medium',
    owner: 'You',
    relatedContactId: 'olivia',
  },
  {
    id: generateId(),
    title: 'Sync with Vertex on GitHub co-build',
    dueDate: '2025-01-14',
    status: 'todo',
    priority: 'medium',
    owner: 'You',
    relatedContactId: 'marcus',
    relatedProjectId: 'github-sync-pipeline',
  },
  {
    id: generateId(),
    title: 'Create playbook for onboarding automation',
    dueDate: '2025-01-16',
    status: 'in-progress',
    priority: 'low',
    owner: 'You',
    relatedProjectId: 'customer-onboarding',
  },
  {
    id: generateId(),
    title: 'Prep Q1 resource drop',
    dueDate: '2025-01-21',
    status: 'todo',
    priority: 'low',
    owner: 'You',
  },
]

const initialProjects: CRMProject[] = [
  {
    id: 'customer-onboarding',
    name: 'Customer Onboarding Accelerator',
    owner: 'You',
    category: 'Success Playbooks',
    status: 'active',
    source: 'manual',
    description: 'Modular onboarding flow with automated check-ins and ROI snapshots.',
    lastUpdated: '2025-01-09',
    nextAction: 'Ship beta assets to Acme team',
  },
  {
    id: 'growth-insights',
    name: 'Growth Insights Hub',
    owner: 'You',
    category: 'Analytics',
    status: 'planning',
    source: 'manual',
    description: 'Unified dashboard for marketing, product adoption, and retention signals.',
    lastUpdated: '2025-01-05',
    nextAction: 'Outline metrics schema',
  },
  {
    id: 'github-sync-pipeline',
    name: 'GitHub Project Sync',
    owner: 'You',
    category: 'Automation',
    status: 'active',
    source: 'manual',
    description: 'Bi-directional sync to surface repo health inside CRM.',
    lastUpdated: '2025-01-08',
    nextAction: 'Test with Vertex sandbox repos',
  },
  {
    id: 'resource-library',
    name: 'Resource Library Refresh',
    owner: 'You',
    category: 'Enablement',
    status: 'backlog',
    source: 'manual',
    description: 'Structured resource hub for prompts, tutorials, and workflows.',
    lastUpdated: '2024-12-29',
    nextAction: 'Prioritize February content themes',
  },
]

export const useCRMStore = create<CRMStore>((set, get) => ({
  contacts: initialContacts,
  companies: initialCompanies,
  deals: initialDeals,
  interactions: initialInteractions,
  tasks: initialTasks,
  projects: initialProjects,
  addImportedProjects: (projects) => {
    const existingIds = new Set(get().projects.map((project) => project.externalId ?? project.id))
    const filtered = projects.filter((project) => {
      if (!project.externalId) {
        return !existingIds.has(project.id)
      }
      return !existingIds.has(project.externalId)
    })
    if (!filtered.length) {
      return
    }
    set((state) => ({
      projects: [...state.projects, ...filtered],
    }))
  },
  updateTaskStatus: (taskId, status) => {
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              status,
            }
          : task
      ),
    }))
  },
  updateDealStage: (dealId, stage) => {
    set((state) => ({
      deals: state.deals.map((deal) =>
        deal.id === dealId
          ? {
              ...deal,
              stage,
            }
          : deal
      ),
    }))
  },
}))
