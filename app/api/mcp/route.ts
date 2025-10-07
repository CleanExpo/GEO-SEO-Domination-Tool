import { createMcpHandler } from 'mcp-handler'
import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const handler = createMcpHandler((server) => {
  // Tool 1: Create Sandbox Session
  server.tool(
    'create_sandbox_session',
    'Creates a new MetaCoder sandbox session for AI-powered code generation',
    {
      session_name: z.string().describe('Name of the sandbox session'),
      description: z.string().optional().describe('Optional description of what this session is for'),
    },
    async ({ session_name, description }) => {
      const supabase = createClient(supabaseUrl, supabaseKey)

      const { data, error } = await supabase
        .from('sandbox_sessions')
        .insert([
          {
            session_name,
            description: description || null,
            active: true,
            file_tree: {},
          },
        ])
        .select()
        .single()

      if (error) {
        return {
          content: [
            {
              type: 'text',
              text: `❌ Failed to create session: ${error.message}`,
            },
          ],
          isError: true,
        }
      }

      return {
        content: [
          {
            type: 'text',
            text: `✅ Created sandbox session: ${session_name}\nSession ID: ${data.id}\nAccess at: https://geo-seo-domination-tool.vercel.app/sandbox`,
          },
        ],
      }
    }
  )

  // Tool 2: Submit Coding Task
  server.tool(
    'submit_coding_task',
    'Submits a code generation task to MetaCoder Sandbox with specified AI agent',
    {
      session_id: z.string().uuid().describe('UUID of the sandbox session'),
      prompt: z.string().describe('Coding task description'),
      agent: z
        .enum(['claude', 'codex', 'cursor', 'gemini', 'opencode'])
        .default('claude')
        .describe('AI agent to use for code generation'),
      install_dependencies: z
        .boolean()
        .default(false)
        .describe('Whether to install npm dependencies'),
      max_duration: z.number().int().min(1).max(30).default(5).describe('Max duration in minutes'),
    },
    async ({ session_id, prompt, agent, install_dependencies, max_duration }) => {
      const supabase = createClient(supabaseUrl, supabaseKey)

      const agentModels = {
        claude: 'claude-sonnet-4-5-20250929',
        codex: 'gpt-5-codex',
        cursor: 'cursor-composer',
        gemini: 'gemini-2.0-flash',
        opencode: 'opencode-engine',
      }

      const { data, error } = await supabase
        .from('sandbox_tasks')
        .insert([
          {
            session_id,
            prompt,
            selected_agent: agent,
            selected_model: agentModels[agent],
            status: 'pending',
            progress: 0,
            logs: [],
            install_dependencies,
            max_duration,
          },
        ])
        .select()
        .single()

      if (error) {
        return {
          content: [
            {
              type: 'text',
              text: `❌ Failed to create task: ${error.message}`,
            },
          ],
          isError: true,
        }
      }

      return {
        content: [
          {
            type: 'text',
            text: `✅ Task submitted successfully!\nTask ID: ${data.id}\nAgent: ${agent}\nStatus: ${data.status}\nView at: https://geo-seo-domination-tool.vercel.app/sandbox`,
          },
        ],
      }
    }
  )

  // Tool 3: Get Sandbox Sessions
  server.tool(
    'list_sandbox_sessions',
    'Lists all sandbox sessions with their current status',
    {
      active_only: z.boolean().default(true).describe('Only show active sessions'),
      limit: z.number().int().min(1).max(50).default(10).describe('Number of sessions to return'),
    },
    async ({ active_only, limit }) => {
      const supabase = createClient(supabaseUrl, supabaseKey)

      let query = supabase
        .from('sandbox_sessions')
        .select('id, session_name, description, active, created_at, updated_at')
        .order('created_at', { ascending: false })
        .limit(limit)

      if (active_only) {
        query = query.eq('active', true)
      }

      const { data, error } = await query

      if (error) {
        return {
          content: [
            {
              type: 'text',
              text: `❌ Failed to fetch sessions: ${error.message}`,
            },
          ],
          isError: true,
        }
      }

      if (!data || data.length === 0) {
        return {
          content: [
            {
              type: 'text',
              text: '📝 No sandbox sessions found. Create one with create_sandbox_session!',
            },
          ],
        }
      }

      const sessionList = data
        .map(
          (s) =>
            `• ${s.session_name} (${s.active ? '🟢 Active' : '⚪ Inactive'})\n  ID: ${s.id}\n  Created: ${new Date(s.created_at).toLocaleString()}`
        )
        .join('\n\n')

      return {
        content: [
          {
            type: 'text',
            text: `📋 Sandbox Sessions (${data.length}):\n\n${sessionList}`,
          },
        ],
      }
    }
  )

  // Tool 4: Get Task Status
  server.tool(
    'get_task_status',
    'Gets the current status and logs of a coding task',
    {
      task_id: z.string().uuid().describe('UUID of the task'),
    },
    async ({ task_id }) => {
      const supabase = createClient(supabaseUrl, supabaseKey)

      const { data, error } = await supabase
        .from('sandbox_tasks')
        .select('*')
        .eq('id', task_id)
        .single()

      if (error) {
        return {
          content: [
            {
              type: 'text',
              text: `❌ Failed to fetch task: ${error.message}`,
            },
          ],
          isError: true,
        }
      }

      const statusEmoji = {
        pending: '⏳',
        processing: '⚙️',
        completed: '✅',
        error: '❌',
      }

      const logs = Array.isArray(data.logs) ? data.logs.slice(-5).join('\n') : 'No logs yet'

      return {
        content: [
          {
            type: 'text',
            text: `${statusEmoji[data.status as keyof typeof statusEmoji]} Task Status\n\nID: ${data.id}\nStatus: ${data.status}\nProgress: ${data.progress}%\nAgent: ${data.selected_agent}\nModel: ${data.selected_model}\n\nPrompt:\n${data.prompt}\n\nRecent Logs:\n${logs}\n\nCreated: ${new Date(data.created_at).toLocaleString()}`,
          },
        ],
      }
    }
  )

  // Tool 5: Generate PWA Manifest
  server.tool(
    'generate_pwa_manifest',
    'Generates a Progressive Web App manifest.json for the MetaCoder Sandbox',
    {
      app_name: z.string().default('MetaCoder Sandbox').describe('Name of the PWA'),
      short_name: z.string().default('Sandbox').describe('Short name for home screen'),
      theme_color: z.string().default('#10b981').describe('Theme color (hex)'),
      background_color: z.string().default('#ffffff').describe('Background color (hex)'),
    },
    async ({ app_name, short_name, theme_color, background_color }) => {
      const manifest = {
        name: app_name,
        short_name: short_name,
        description: 'AI-powered code generation sandbox with Claude Code, GPT-5 Codex, and more',
        start_url: '/sandbox',
        display: 'standalone',
        theme_color: theme_color,
        background_color: background_color,
        icons: [
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
        orientation: 'portrait-primary',
        categories: ['development', 'productivity', 'utilities'],
        screenshots: [
          {
            src: '/screenshots/sandbox-wide.png',
            sizes: '1280x720',
            type: 'image/png',
            form_factor: 'wide',
          },
          {
            src: '/screenshots/sandbox-narrow.png',
            sizes: '750x1334',
            type: 'image/png',
            form_factor: 'narrow',
          },
        ],
      }

      return {
        content: [
          {
            type: 'text',
            text: `✅ PWA Manifest Generated:\n\n\`\`\`json\n${JSON.stringify(manifest, null, 2)}\n\`\`\`\n\nSave this as \`public/manifest.json\` and add to your HTML:\n\`\`\`html\n<link rel="manifest" href="/manifest.json">\n\`\`\``,
          },
        ],
      }
    }
  )

  // Resource 1: Sandbox Analytics
  server.resource(
    'sandbox://analytics',
    'Real-time analytics and metrics for all sandbox sessions',
    'application/json',
    async () => {
      const supabase = createClient(supabaseUrl, supabaseKey)

      const { data: tasks, error } = await supabase
        .from('sandbox_task_analytics')
        .select('*')
        .limit(100)

      if (error) {
        return JSON.stringify({ error: error.message })
      }

      const analytics = {
        total_tasks: tasks?.length || 0,
        by_status: tasks?.reduce((acc: any, task: any) => {
          acc[task.status] = (acc[task.status] || 0) + 1
          return acc
        }, {}),
        by_agent: tasks?.reduce((acc: any, task: any) => {
          acc[task.selected_agent] = (acc[task.selected_agent] || 0) + 1
          return acc
        }, {}),
        total_tokens: tasks?.reduce((sum: number, task: any) => sum + (task.tokens_used || 0), 0),
        total_cost: tasks?.reduce((sum: number, task: any) => sum + parseFloat(task.cost_usd || 0), 0),
      }

      return JSON.stringify(analytics, null, 2)
    }
  )
})

export { handler as GET, handler as POST }
