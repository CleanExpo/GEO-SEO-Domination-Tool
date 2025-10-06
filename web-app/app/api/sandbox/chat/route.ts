import { anthropic } from '@ai-sdk/anthropic'
import { openai } from '@ai-sdk/openai'
import { streamText } from 'ai'

export const runtime = 'edge'

const agentProviders = {
  claude: anthropic('claude-sonnet-4-5-20250929'),
  codex: openai('gpt-4'), // Using GPT-4 as GPT-5 Codex placeholder
  cursor: openai('gpt-4'), // Using GPT-4 as Cursor placeholder
  gemini: openai('gpt-4'), // Using GPT-4 as Gemini placeholder (would use @ai-sdk/google in production)
  opencode: openai('gpt-4'), // Using GPT-4 as OpenCode placeholder
}

export async function POST(req: Request) {
  try {
    const { messages, agent = 'claude', sessionId, taskId } = await req.json()

    const selectedModel = agentProviders[agent as keyof typeof agentProviders] || agentProviders.claude

    const result = streamText({
      model: selectedModel,
      messages,
      system: `You are an expert software developer. Generate clean, production-ready code based on user requirements.

Focus on:
- Writing well-structured, maintainable code
- Following best practices and conventions
- Adding helpful comments where needed
- Handling errors gracefully
- Considering performance and security

Session ID: ${sessionId}
Task ID: ${taskId}`,
      maxTokens: 4096,
      temperature: 0.7,
    })

    return result.toDataStreamResponse()
  } catch (error) {
    console.error('Chat API error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to process chat request' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}
