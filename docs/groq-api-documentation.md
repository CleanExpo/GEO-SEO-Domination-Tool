# Groq API Documentation

## Overview

Groq provides fast LLM (Large Language Model) inference with OpenAI-compatible API. The platform emphasizes speed, ease of use, and flexible AI model interactions.

**Base URL:** `https://api.groq.com/openai/v1`

**Key Features:**
- ⚡ Ultra-fast inference (up to 1200 tokens/sec)
- 💰 Cost-effective pricing (85-95% cheaper than premium AI services)
- 🔌 OpenAI-compatible API (drop-in replacement)
- 🛠️ Built-in tool use and function calling
- 🌐 Remote MCP (Model Context Protocol) support
- 🎯 Structured outputs and reasoning

---

## Quick Start

### 1. Get API Key

Environment variable: `GROQ_API_KEY`

Generate your API key at: https://console.groq.com/keys

**Set environment variable:**
```bash
export GROQ_API_KEY=<your-api-key-here>
```

### 2. Install SDK

**JavaScript/TypeScript:**
```bash
npm install groq-sdk
# or
npm install openai  # OpenAI SDK works with Groq
```

**Python:**
```bash
pip install groq
```

### 3. Basic Usage

**JavaScript Example:**
```javascript
import OpenAI from "openai";

const client = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: "https://api.groq.com/openai/v1",
});

const response = await client.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
        {
            role: "user",
            content: "Explain the importance of fast language models"
        }
    ],
});

console.log(response.choices[0].message.content);
```

**Python Example:**
```python
import os
from groq import Groq

client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

chat_completion = client.chat.completions.create(
    messages=[
        {
            "role": "user",
            "content": "Explain the importance of fast language models",
        }
    ],
    model="llama-3.3-70b-versatile",
)

print(chat_completion.choices[0].message.content)
```

---

## Available Models

### Production Models

| Model | Speed | Price (Input/Output per 1M tokens) | Context Window |
|-------|-------|-----------------------------------|----------------|
| **Llama 3.1 8B Instant** | 560 tok/s | $0.05 / $0.08 | 131,072 |
| **Llama 3.3 70B Versatile** | 280 tok/s | $0.59 / $0.79 | 131,072 |
| **Llama Guard 4 12B** | 1200 tok/s | $0.20 / $0.20 | 131,072 |
| **OpenAI GPT OSS 120B** | 500 tok/s | $0.15 / $0.75 | 131,072 |
| **OpenAI GPT OSS 20B** | 1000 tok/s | $0.10 / $0.50 | 131,072 |

### Production Systems

| System | Speed | Capabilities |
|--------|-------|--------------|
| **Groq Compound** | ~450 tok/s | Web search, code execution, Wolfram Alpha |
| **Groq Compound Mini** | ~450 tok/s | Similar to Compound |

### Preview Models

Additional preview models available including:
- Llama 4 Maverick
- Llama 4 Scout
- Qwen 3 32B
- Kimi K2 0905

---

## API Endpoints

### Chat Completions

**Endpoint:** `POST https://api.groq.com/openai/v1/chat/completions`

Creates model responses for chat conversations.

**Request Parameters:**
- `model` (required) - Model ID to use
- `messages` (required) - Array of message objects
- `temperature` (optional) - Sampling temperature (0-2)
- `max_tokens` (optional) - Maximum tokens to generate
- `top_p` (optional) - Nucleus sampling parameter
- `stream` (optional) - Whether to stream responses
- `tools` (optional) - Array of tool definitions
- `tool_choice` (optional) - Control tool selection

**Example Request:**
```javascript
const completion = await client.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: "What is 2+2?" }
    ],
    temperature: 0.7,
    max_tokens: 1024,
});
```

### Audio Endpoints

**Transcription:** Convert audio to text
```javascript
const transcription = await client.audio.transcriptions.create({
    file: audioFile,
    model: "whisper-large-v3",
});
```

**Translation:** Translate audio to English
```javascript
const translation = await client.audio.translations.create({
    file: audioFile,
    model: "whisper-large-v3",
});
```

**Speech Generation:** Convert text to audio
```javascript
const speech = await client.audio.speech.create({
    model: "distil-whisper-large-v3-en",
    input: "Hello, how are you?",
    voice: "alloy",
});
```

### Models Endpoint

**List Models:** `GET https://api.groq.com/openai/v1/models`

Returns available models and their capabilities.

```javascript
const models = await client.models.list();
console.log(models.data);
```

---

## Tool Use (Function Calling)

Tool use allows LLMs to interact with external resources like APIs, databases, and web services.

### Basic Workflow

1. Define available tools with detailed descriptions
2. Provide tools to the LLM alongside user prompt
3. Let the model decide when to use tools
4. Execute selected tool and return results
5. Model formulates response using tool output

### Example: Weather Tool

```javascript
const tools = [
    {
        type: "function",
        function: {
            name: "get_weather",
            description: "Get the current weather for a location",
            parameters: {
                type: "object",
                properties: {
                    location: {
                        type: "string",
                        description: "The city and state, e.g. San Francisco, CA"
                    },
                    unit: {
                        type: "string",
                        enum: ["celsius", "fahrenheit"],
                        description: "Temperature unit"
                    }
                },
                required: ["location"]
            }
        }
    }
];

const response = await client.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
        { role: "user", content: "What's the weather in San Francisco?" }
    ],
    tools: tools,
    tool_choice: "auto",
});

// Check if model wants to call a tool
if (response.choices[0].message.tool_calls) {
    const toolCall = response.choices[0].message.tool_calls[0];
    // Execute the tool with the provided arguments
    const weatherData = await getWeather(JSON.parse(toolCall.function.arguments));

    // Return results to model
    const finalResponse = await client.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
            { role: "user", content: "What's the weather in San Francisco?" },
            response.choices[0].message,
            {
                role: "tool",
                tool_call_id: toolCall.id,
                content: JSON.stringify(weatherData)
            }
        ],
    });

    console.log(finalResponse.choices[0].message.content);
}
```

---

## Remote MCP (Model Context Protocol)

Remote MCP enables AI applications to connect with external systems standardized through the Model Context Protocol.

**Think of MCP as a "USB-C port for AI applications"** - a standardized way for AI models to interact with external data and workflows.

### Supported Models

- Llama 3.3-70B-versatile
- Llama 3.1-8B-instant
- OpenAI GPT-OSS 120B
- OpenAI GPT-OSS 20B
- Moonshot Kimi K2
- Qwen 3 32B

### Key Features

- ✅ Drop-in compatibility with OpenAI integrations
- ⚡ Superior performance
- 💰 Cost-efficient tool interactions
- 🔒 Built-in security controls
- 🔧 Access to thousands of tools (GitHub, browsers, databases, etc.)

### Basic Usage

```javascript
const response = await client.responses.create({
    model: "openai/gpt-oss-120b",
    input: "What models are trending on Huggingface?",
    tools: [
        {
            type: "mcp",
            server_label: "Huggingface",
            server_url: "https://huggingface.co/mcp"
        }
    ]
});
```

### Current Limitations (Beta)

- ❌ Approvals not yet supported (`"require_approval": true`)
- ❌ Streaming not yet supported (`"streaming": true`)
- ❌ Filtering tools not yet supported (`"allowed_tools": ["tool1", "tool2"]`)

### Available MCP Servers

**Official Groq MCP Cookbooks:**
- BrowserBase MCP - Browser automation
- BrowserUse MCP - Web browsing
- Exa MCP - Web search
- Firecrawl MCP - Web scraping
- HuggingFace MCP - ML models
- Parallel MCP - Concurrent operations
- Stripe MCP - Payment processing
- Tavily MCP - Search API

---

## Groq MCP Server Setup

The official Groq MCP Server enables querying Groq AI models through MCP.

### Capabilities

- 🖼️ Vision analysis of images
- 🔊 Text-to-speech conversion
- 🎤 Speech-to-text transcription
- 📦 Batch processing of requests
- 🤖 Agentic tasks (web search, code generation)

### Installation

**Quick Setup (Recommended):**
```bash
git clone https://github.com/groq/groq-mcp-server
cd groq-mcp-server
./scripts/setup.sh
./scripts/install.sh
```

**Manual Setup:**
```bash
git clone https://github.com/groq/groq-mcp-server
cd groq-mcp-server
uv venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
uv pip install -e ".[dev]"
```

### Configuration

1. Copy `.env.example` to `.env`
2. Add your Groq API key:
   ```
   GROQ_API_KEY=your_api_key_here
   ```

### Claude Desktop Integration

Add to Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "groq": {
      "command": "uv",
      "args": [
        "--directory",
        "/path/to/groq-mcp-server",
        "run",
        "groq-mcp-server"
      ],
      "env": {
        "GROQ_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

### Example Commands

**Vision Analysis:**
```
Describe this image [URL to image]
```

**Text-to-Speech:**
```
Convert text to speech using Arista-PlayAI voice
```

**Transcription:**
```
Transcribe audio file using whisper-large-v3
```

---

## Integration with GEO-SEO Tool

### Use Cases for SEO Analysis

1. **Content Generation with Groq Compound**
   - Use web search + code execution for SEO research
   - Generate optimized content at 450 tokens/sec
   - Cost: ~$0.15/1M input tokens

2. **Local SEO Analysis with Llama 3.3 70B**
   - Analyze competitor websites
   - Extract structured data
   - Speed: 280 tokens/sec
   - Cost: $0.59 input / $0.79 output per 1M tokens

3. **Bulk Keyword Analysis with Llama 3.1 8B**
   - Process large keyword lists
   - Speed: 560 tokens/sec
   - Cost: $0.05 input / $0.08 output per 1M tokens

4. **Vision-based Audits**
   - Screenshot analysis of competitor sites
   - UI/UX recommendations
   - Use Llama 3.2 Vision models

### Cost Comparison

| Task | Groq (Llama 3.1 8B) | Claude Sonnet 4.5 | Savings |
|------|---------------------|-------------------|---------|
| 10K keywords analysis | $0.50 | $30 | **98%** |
| 100 SEO audits | $2.00 | $50 | **96%** |
| 1000 content pieces | $5.00 | $150 | **97%** |

### Implementation Example

```javascript
// services/api/groq.ts
import OpenAI from 'openai';

export const groqClient = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: 'https://api.groq.com/openai/v1',
});

export async function analyzeCompetitorSEO(url: string) {
  const response = await groqClient.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      {
        role: 'system',
        content: 'You are an expert SEO analyst. Analyze websites and provide actionable recommendations.'
      },
      {
        role: 'user',
        content: `Analyze the SEO of this website: ${url}. Focus on: title tags, meta descriptions, header structure, content quality, and technical SEO.`
      }
    ],
    temperature: 0.3,
    max_tokens: 2048,
  });

  return response.choices[0].message.content;
}

export async function generateLocalSEOContent(business: any) {
  const response = await groqClient.chat.completions.create({
    model: 'llama-3.1-8b-instant',
    messages: [
      {
        role: 'system',
        content: 'You are a local SEO content writer. Generate optimized content for local businesses.'
      },
      {
        role: 'user',
        content: `Generate SEO-optimized content for: ${business.name} in ${business.location}. Industry: ${business.industry}`
      }
    ],
    temperature: 0.7,
    max_tokens: 1024,
  });

  return response.choices[0].message.content;
}
```

---

## Best Practices

### Model Selection

1. **For Speed-Critical Tasks:** Use Llama 3.1 8B Instant (560 tok/s)
2. **For Quality + Speed:** Use Llama 3.3 70B Versatile (280 tok/s)
3. **For Agent Workflows:** Use Groq Compound (~450 tok/s + tools)
4. **For Cost Optimization:** Use OpenAI GPT OSS 20B (1000 tok/s, $0.10/$0.50)

### Cost Optimization

1. **Use smaller models for simple tasks** (Llama 3.1 8B)
2. **Batch requests when possible**
3. **Set appropriate max_tokens limits**
4. **Use streaming for better UX** (doesn't affect cost)
5. **Cache common prompts in application layer**

### Error Handling

```javascript
try {
  const response = await groqClient.chat.completions.create({...});
  return response;
} catch (error) {
  if (error.status === 429) {
    // Rate limit - implement exponential backoff
    await sleep(1000);
    return retry();
  } else if (error.status === 500) {
    // Server error - fallback to another model
    return fallbackModel();
  }
  throw error;
}
```

---

## Rate Limits

Refer to: https://console.groq.com/docs/rate-limits

Rate limits vary by model and subscription tier. Implement exponential backoff for production applications.

---

## Additional Resources

- **Groq Console:** https://console.groq.com
- **API Documentation:** https://console.groq.com/docs/api-reference
- **Groq MCP Server:** https://github.com/groq/groq-mcp-server
- **MCP Specification:** https://modelcontextprotocol.io/specification/2025-06-18
- **Groq Blog:** https://groq.com/blog
- **Developer Community:** Join via Groq Console

---

## Environment Variables

```bash
# Required
GROQ_API_KEY=your_groq_api_key_here

# Optional (for MCP server)
GROQ_MODEL=llama-3.3-70b-versatile
GROQ_TEMPERATURE=0.7
GROQ_MAX_TOKENS=2048
```

---

**Last Updated:** 2025-01-13
**Status:** Production Ready
**API Version:** v1 (OpenAI-compatible)
