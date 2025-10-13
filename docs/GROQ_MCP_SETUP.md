# Groq MCP Server Setup Guide

This guide walks you through setting up the Groq Model Context Protocol (MCP) server for ultra-fast, cost-effective AI inference in the GEO-SEO Domination Tool.

## Why Groq?

**Speed:** Up to 1200 tokens/sec (10x faster than standard LLMs)
**Cost:** 85-97% cheaper than Claude/GPT-4
**Compatibility:** Drop-in OpenAI replacement
**Quality:** Production-grade models (Llama 3.3 70B, GPT-OSS 120B)

## Prerequisites

- Node.js 18+ or Python 3.10+
- Groq API key (free tier available)
- Git

## Step 1: Get Groq API Key

1. Visit https://console.groq.com/keys
2. Sign up or log in
3. Click "Create API Key"
4. Copy your API key (starts with `gsk_...`)

## Step 2: Add to Environment Variables

### For GEO-SEO Tool (Next.js)

**Add to `.env.local`:**
```bash
GROQ_API_KEY=gsk_your_actual_key_here
```

**Add to Vercel (Production):**
```bash
vercel env add GROQ_API_KEY
# Enter your key when prompted
# Select: Production, Preview, Development (all)
```

### For Claude Desktop (MCP Server)

The Groq MCP server will be configured separately below.

## Step 3: Install Groq MCP Server

### Option A: Quick Install (Recommended)

```bash
# Clone the official Groq MCP server
git clone https://github.com/groq/groq-mcp-server
cd groq-mcp-server

# Run automated setup
./scripts/setup.sh
./scripts/install.sh
```

### Option B: Manual Install

```bash
# Clone repository
git clone https://github.com/groq/groq-mcp-server
cd groq-mcp-server

# Create virtual environment
uv venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
uv pip install -e ".[dev]"
```

## Step 4: Configure MCP Server

### Create Configuration File

**Copy example environment:**
```bash
cp .env.example .env
```

**Edit `.env` and add your Groq API key:**
```bash
GROQ_API_KEY=gsk_your_actual_key_here
GROQ_MODEL=llama-3.3-70b-versatile  # Default model
GROQ_TEMPERATURE=0.7
GROQ_MAX_TOKENS=2048
```

## Step 5: Integrate with Claude Desktop

### Locate Claude Config File

**macOS:**
```
~/Library/Application Support/Claude/claude_desktop_config.json
```

**Windows:**
```
%APPDATA%\Claude\claude_desktop_config.json
```

**Linux:**
```
~/.config/Claude/claude_desktop_config.json
```

### Update Claude Config

**Add Groq MCP server to `claude_desktop_config.json`:**

```json
{
  "mcpServers": {
    "groq": {
      "command": "uv",
      "args": [
        "--directory",
        "/absolute/path/to/groq-mcp-server",
        "run",
        "groq-mcp-server"
      ],
      "env": {
        "GROQ_API_KEY": "gsk_your_actual_key_here"
      }
    }
  }
}
```

**Important:** Replace `/absolute/path/to/groq-mcp-server` with the actual path.

### For Windows Users

If using Windows, replace `uv` command with:

```json
{
  "mcpServers": {
    "groq": {
      "command": "cmd",
      "args": [
        "/c",
        "cd",
        "D:\\path\\to\\groq-mcp-server",
        "&&",
        ".venv\\Scripts\\activate",
        "&&",
        "python",
        "-m",
        "groq_mcp_server"
      ],
      "env": {
        "GROQ_API_KEY": "gsk_your_actual_key_here"
      }
    }
  }
}
```

## Step 6: Restart Claude Desktop

1. Quit Claude Desktop completely
2. Relaunch Claude Desktop
3. Check MCP servers are loaded (look for 🔌 icon in interface)

## Step 7: Test Groq MCP Server

### In Claude Desktop

Try these commands:

**Vision Analysis:**
```
Describe this image: https://example.com/image.jpg
```

**Text-to-Speech:**
```
Convert "Hello world" to speech using Groq
```

**Transcription:**
```
Transcribe this audio file: [URL to audio]
```

**SEO Analysis:**
```
Use Groq to analyze the SEO of https://example.com
```

## Step 8: Integrate with GEO-SEO Tool

### Import Groq Service

```typescript
// In your Next.js API route or service
import groqService from '@/services/api/groq';

// Example: Analyze competitor SEO
const analysis = await groqService.analyzeCompetitorSEO(
  'https://competitor.com',
  htmlContent
);

// Example: Generate local SEO content
const content = await groqService.generateLocalSEOContent({
  name: 'Best Plumbing Co',
  location: 'Brisbane, Australia',
  industry: 'Plumbing Services',
  targetKeywords: ['emergency plumber brisbane', '24/7 plumbing'],
});

// Example: Batch keyword analysis
const keywordBatches = [
  ['seo brisbane', 'local seo'],
  ['google my business', 'local rankings'],
];
const results = await groqService.batchAnalyzeKeywords(keywordBatches);
```

### Cost Estimation

```typescript
import { estimateCost, GroqModels } from '@/services/api/groq';

const cost = estimateCost(
  1000,  // input tokens
  500,   // output tokens
  GroqModels.LLAMA_70B_VERSATILE
);

console.log(`Estimated cost: $${cost.toFixed(4)}`);
// Output: Estimated cost: $0.0010 (vs $0.0195 with Claude Sonnet)
```

## Available Groq Models

| Model | Speed | Cost (per 1M tokens) | Best For |
|-------|-------|---------------------|----------|
| **Llama 3.1 8B Instant** | 560 tok/s | $0.05 / $0.08 | Bulk processing, simple tasks |
| **Llama 3.3 70B Versatile** | 280 tok/s | $0.59 / $0.79 | SEO analysis, content gen |
| **GPT-OSS 20B** | 1000 tok/s | $0.10 / $0.50 | Fast classification |
| **GPT-OSS 120B** | 500 tok/s | $0.15 / $0.75 | Complex reasoning |
| **Groq Compound** | 450 tok/s | $0.15 / $0.75 | Agent workflows + tools |

## Use Cases in GEO-SEO Tool

### 1. Bulk Keyword Analysis
**Model:** Llama 3.1 8B Instant
**Speed:** 560 tok/s
**Cost:** $0.05 input / $0.08 output per 1M tokens

```typescript
// Process 10,000 keywords
const keywords = [...]; // 10K keywords
const batches = chunkArray(keywords, 100); // 100 keyword batches
const results = await groqService.batchAnalyzeKeywords(batches);
// Cost: ~$2 (vs ~$60 with Claude)
```

### 2. Competitor Content Analysis
**Model:** Llama 3.3 70B Versatile
**Speed:** 280 tok/s
**Cost:** $0.59 input / $0.79 output per 1M tokens

```typescript
// Analyze 100 competitor pages
for (const url of competitorUrls) {
  const analysis = await groqService.analyzeCompetitorSEO(url);
  // Extract insights, save to database
}
// Cost: ~$5 (vs ~$150 with Claude)
```

### 3. Local SEO Content Generation
**Model:** Llama 3.1 8B Instant
**Speed:** 560 tok/s
**Cost:** $0.05 input / $0.08 output per 1M tokens

```typescript
// Generate 1000 local business pages
for (const business of businesses) {
  const content = await groqService.generateLocalSEOContent({
    name: business.name,
    location: business.location,
    industry: business.industry,
  });
  // Save generated content
}
// Cost: ~$3 (vs ~$100 with Claude)
```

### 4. Real-time SEO Recommendations
**Model:** GPT-OSS 20B
**Speed:** 1000 tok/s
**Cost:** $0.10 input / $0.50 output per 1M tokens

```typescript
// Instant recommendations as user types
const recommendations = await groqService.improveContentSEO(
  userContent,
  targetKeyword
);
// Real-time response (<1 second)
// Cost: ~$0.001 per request
```

## Troubleshooting

### MCP Server Not Appearing in Claude

1. **Check config file location:**
   ```bash
   # macOS/Linux
   cat ~/Library/Application\ Support/Claude/claude_desktop_config.json

   # Windows
   type %APPDATA%\Claude\claude_desktop_config.json
   ```

2. **Validate JSON syntax:**
   - Use https://jsonlint.com to check for errors
   - Ensure no trailing commas
   - Check quotes are properly escaped

3. **Check server path:**
   ```bash
   # Test the command manually
   cd /path/to/groq-mcp-server
   uv run groq-mcp-server
   ```

4. **Restart Claude completely:**
   - Quit Claude Desktop (not just close window)
   - Kill any Claude processes in Task Manager
   - Relaunch

### API Key Errors

**Error:** `Authentication failed`
**Fix:** Verify API key is correct, starts with `gsk_`

**Error:** `Rate limit exceeded`
**Fix:** Implement exponential backoff or upgrade Groq plan

**Error:** `Model not found`
**Fix:** Use correct model name from GroqModels enum

### Performance Issues

**Slow responses:**
- Use faster models (Llama 3.1 8B, GPT-OSS 20B)
- Reduce max_tokens
- Enable streaming for better UX

**High costs:**
- Use Llama 3.1 8B for simple tasks
- Batch similar requests
- Cache common responses

## Advanced Configuration

### Custom Model Selection

```typescript
// services/api/groq.ts
export const GroqModels = {
  FAST: 'llama-3.1-8b-instant',      // Speed-critical
  BALANCED: 'llama-3.3-70b-versatile', // Quality + speed
  QUALITY: 'openai/gpt-oss-120b',     // Best reasoning
  AGENT: 'groq-compound',             // With tools
} as const;
```

### Streaming Responses

```typescript
const stream = await groqService.createChatCompletion({
  model: GroqModels.LLAMA_70B_VERSATILE,
  messages: [...],
  stream: true,
});

for await (const chunk of stream) {
  process.stdout.write(chunk.choices[0]?.delta?.content || '');
}
```

### Error Handling with Fallback

```typescript
async function robustAnalysis(url: string) {
  try {
    // Try Groq first (fast + cheap)
    return await groqService.analyzeCompetitorSEO(url);
  } catch (error) {
    console.warn('Groq failed, falling back to Claude:', error);
    // Fallback to Claude
    return await claudeService.analyzeCompetitorSEO(url);
  }
}
```

## Cost Comparison

| Task | Groq (Llama 3.1 8B) | Claude Sonnet 4.5 | Savings |
|------|---------------------|-------------------|---------|
| **10K Keywords** | $0.50 | $30.00 | **98%** |
| **100 SEO Audits** | $2.00 | $50.00 | **96%** |
| **1000 Content Pieces** | $5.00 | $150.00 | **97%** |
| **Daily Analysis (10GB)** | $15/mo | $450/mo | **97%** |

## Next Steps

1. ✅ Add `GROQ_API_KEY` to environment variables
2. ✅ Install and configure Groq MCP server
3. ✅ Test in Claude Desktop
4. ✅ Integrate with GEO-SEO Tool
5. 📊 Monitor usage and costs in Groq Console
6. 🚀 Optimize model selection for each use case

## Resources

- **Groq Console:** https://console.groq.com
- **Groq MCP Server:** https://github.com/groq/groq-mcp-server
- **API Documentation:** https://console.groq.com/docs
- **MCP Specification:** https://modelcontextprotocol.io
- **GEO-SEO Groq Service:** `services/api/groq.ts`

---

**Last Updated:** 2025-01-13
**Status:** Production Ready
**Support:** See Groq Console or GEO-SEO Tool documentation
