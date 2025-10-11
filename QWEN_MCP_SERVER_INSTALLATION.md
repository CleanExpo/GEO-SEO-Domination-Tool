# ✅ Qwen MCP Server Installation - COMPLETE

**Date**: October 11, 2025
**Status**: ✅ **READY TO USE**

---

## 🎉 What Was Installed

### Qwen MCP Server
- **Repository**: https://github.com/66julienmartin/MCP-server-Qwen_Max.git
- **Model**: `qwen-max-latest` (Qwen3-Max - Latest version)
- **Location**: `.claude/qwen-mcp-server/`
- **Build Status**: ✅ Compiled successfully

### Configuration
- **API Key Source**: Pulled from Vercel environment variables
- **Key**: `QWEN_API_KEY = sk-6ace9bd6d79242fe9c302ca2aaf745b6`
- **Base URL**: `https://dashscope-intl.aliyuncs.com/compatible-mode/v1` (Singapore region)

---

## 📊 Qwen3-Max Specifications

### Model: qwen-max-latest

**Context Window**: 32,768 tokens
- Max input: 30,720 tokens
- Max output: 8,192 tokens

**Pricing**:
- Input: $0.0016/1K tokens ($1.60 per 1M tokens)
- Output: $0.0064/1K tokens ($6.40 per 1M tokens)

**Free Quota**: 1 million tokens

**Capabilities**:
- Best inference performance for complex tasks
- Multi-step reasoning
- Code generation
- Technical analysis
- SEO optimization
- Content creation

---

## 🔧 Installation Steps Completed

### 1. Cloned Repository ✅
```bash
cd .claude
git clone https://github.com/66julienmartin/MCP-server-Qwen_Max.git qwen-mcp-server
```

### 2. Installed Dependencies ✅
```bash
cd qwen-mcp-server
npm install
```

**Dependencies**:
- `@modelcontextprotocol/sdk@0.6.0` - MCP protocol
- `openai@^4.80.1` - OpenAI-compatible client
- `dotenv@^16.4.7` - Environment variables

### 3. Fixed TypeScript Build Error ✅
**Issue**: Type conversion error in parameter handling

**Fix Applied**:
```typescript
// Before (caused error)
const { prompt, max_tokens = 8192, temperature = 0.7 } =
    request.params.arguments as QwenMaxArgs;

// After (works)
const args = request.params.arguments as unknown as QwenMaxArgs;
const { prompt, max_tokens = 8192, temperature = 0.7 } = args;

if (!prompt) {
    throw new McpError(ErrorCode.InvalidParams, "prompt is required");
}
```

### 4. Built Server ✅
```bash
npm run build
```

Output: Compiled successfully to `build/index.js`

### 5. Configured Claude Code ✅

**Added to `.claude/mcp.json`**:
```json
{
  "qwen-max": {
    "command": "node",
    "args": [
      "D:\\GEO_SEO_Domination-Tool\\.claude\\qwen-mcp-server\\build\\index.js"
    ],
    "env": {
      "DASHSCOPE_API_KEY": "sk-6ace9bd6d79242fe9c302ca2aaf745b6"
    },
    "description": "Qwen Max (Qwen3-Max) AI Model - Cost-optimized for SEO analysis"
  }
}
```

**Added to `.claude/settings.local.json`**:
```json
{
  "enabledMcpjsonServers": [
    ...
    "qwen-max"
  ]
}
```

---

## 🚀 How to Use

### Within Claude Code

The Qwen MCP server provides a `qwen_max` tool that can be called for AI-powered text generation:

```typescript
// Tool call format
{
  "name": "qwen_max",
  "arguments": {
    "prompt": "Your prompt here",
    "max_tokens": 8192,      // Optional, default: 8192
    "temperature": 0.7        // Optional, default: 0.7, range: 0-2
  }
}
```

### Temperature Settings

**Recommended by task type**:
- **Code generation**: 0.0-0.3
- **Technical writing**: 0.3-0.5
- **General tasks**: 0.7 (default)
- **Creative writing**: 0.8-1.0

### Example Prompts

**1. SEO Analysis**:
```json
{
  "prompt": "Analyze this website for local SEO opportunities: [website URL]. Provide actionable recommendations.",
  "temperature": 0.3,
  "max_tokens": 4000
}
```

**2. Content Generation**:
```json
{
  "prompt": "Write a comprehensive blog post about local SEO best practices for plumbers in Brisbane, Australia.",
  "temperature": 0.7,
  "max_tokens": 6000
}
```

**3. Competitor Analysis**:
```json
{
  "prompt": "Compare these 3 competitors' Google Business Profiles and identify gaps: [competitor data]",
  "temperature": 0.3,
  "max_tokens": 5000
}
```

---

## 🔄 Integration with Cascading AI

The Qwen MCP server complements the cascading AI service we built earlier:

| Use Case | Recommendation |
|----------|----------------|
| **Programmatic API calls** | Use cascading AI service (`services/api/cascading-ai.ts`) |
| **Interactive analysis in Claude Code** | Use Qwen MCP server tool |
| **Background jobs** | Use cascading AI service |
| **Manual exploration** | Use Qwen MCP server tool |

**Both use the same Qwen API**, so cost savings apply equally!

---

## 📊 Cost Comparison

### Qwen3-Max vs Other Models

For a typical 2000-token prompt + 1000-token response:

| Model | Input Cost | Output Cost | Total Cost | Savings |
|-------|-----------|-------------|------------|---------|
| **Qwen3-Max** | $0.0032 | $0.0064 | **$0.0096** | Baseline |
| Qwen Plus | $0.0008 | $0.0012 | $0.0020 | 79% cheaper |
| Qwen Turbo | $0.0001 | $0.0002 | $0.0003 | 97% cheaper |
| Claude Opus | $0.0300 | $0.0750 | $0.1050 | 91% more expensive |
| Claude Sonnet 4.5 | $0.0060 | $0.0150 | $0.0210 | 54% more expensive |

**Best Value**: Qwen3-Max provides premium performance at 91% less cost than Claude Opus

---

## 🧪 Testing

### Manual Test in Claude Code

Once Claude Code restarts, you can test the Qwen MCP server:

**Simple test**:
```
Call the qwen_max tool with prompt: "Say 'Hello from Qwen3-Max!'"
```

**SEO Analysis test**:
```
Call qwen_max to analyze local SEO for a Brisbane plumber website and provide 5 key recommendations
```

### Via Command Line

You can also test the server directly:

```bash
cd .claude/qwen-mcp-server
export DASHSCOPE_API_KEY="sk-6ace9bd6d79242fe9c302ca2aaf745b6"
npm start
```

Then send MCP protocol messages via stdin.

---

## 📁 File Structure

```
.claude/qwen-mcp-server/
├── src/
│   └── index.ts                # Server implementation
├── build/
│   └── index.js                # Compiled server ✅
├── node_modules/               # Dependencies ✅
├── package.json                # NPM configuration
├── package-lock.json
├── tsconfig.json
├── README.md
└── LICENSE
```

---

## 🚨 Troubleshooting

### Issue 1: MCP Server Not Appearing

**Symptoms**: qwen_max tool not available in Claude Code

**Solution**:
1. **Restart Claude Code** (File → Quit, then reopen)
2. Check `.claude/settings.local.json` has `"qwen-max"` in `enabledMcpjsonServers`
3. Verify `.claude/mcp.json` has `qwen-max` configuration

### Issue 2: "DASHSCOPE_API_KEY is required"

**Symptoms**: Error when calling qwen_max tool

**Solution**:
1. Verify API key in `.claude/mcp.json` is correct
2. Test API key directly:
   ```bash
   curl -X POST https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer sk-6ace9bd6d79242fe9c302ca2aaf745b6" \
     -d '{"model":"qwen-max-latest","messages":[{"role":"user","content":"Hello"}]}'
   ```

### Issue 3: Build Errors

**Symptoms**: `npm run build` fails

**Solution**:
1. Ensure TypeScript is installed: `npm install`
2. Check Node.js version: `node --version` (need v18+)
3. Re-run build: `npm run build`

### Issue 4: Server Crashes

**Symptoms**: Qwen MCP server stops working

**Check logs**:
1. Claude Code logs will show MCP errors
2. Look for "Qwen API Error" messages
3. Common causes:
   - API key expired
   - Rate limits exceeded
   - Network connectivity issues

**Solution**:
- Verify API key is still valid
- Check Alibaba Cloud console for quota: https://modelstudio.console.alibabacloud.com/
- Restart Claude Code

---

## 🔐 Security Notes

### API Key Storage

**Current**: API key stored in `.claude/mcp.json` (local file, not committed)

**Production Recommendation**:
- Store API key in environment variables
- Use `.env` file (already supported by server)
- Update mcp.json to reference env var:
  ```json
  "env": {
    "DASHSCOPE_API_KEY": "${QWEN_API_KEY}"
  }
  ```

### Key Rotation

If you need to rotate the API key:
1. Generate new key at: https://modelstudio.console.alibabacloud.com/?tab=model#/api-key
2. Update in Vercel: `vercel env add QWEN_API_KEY`
3. Update `.claude/mcp.json`
4. Restart Claude Code

---

## 📚 Resources

### Documentation
- **Qwen Models**: https://www.alibabacloud.com/help/en/model-studio/getting-started/models
- **MCP Protocol**: https://modelcontextprotocol.io/
- **Alibaba Cloud Model Studio**: https://modelstudio.console.alibabacloud.com/

### API Keys
- **Get Qwen API Key**: https://modelstudio.console.alibabacloud.com/?tab=model#/api-key
- **Manage Keys**: https://ram.console.aliyun.com/

### GitHub Repository
- **Source Code**: https://github.com/66julienmartin/MCP-server-Qwen_Max.git

---

## ✅ Verification Checklist

- [x] Repository cloned to `.claude/qwen-mcp-server/`
- [x] Dependencies installed (`node_modules/` exists)
- [x] TypeScript build error fixed
- [x] Server built successfully (`build/index.js` exists)
- [x] API key retrieved from Vercel
- [x] MCP configuration added (`.claude/mcp.json`)
- [x] Server enabled (`.claude/settings.local.json`)
- [ ] Claude Code restarted (required to load new MCP server)
- [ ] Qwen MCP server tested (call `qwen_max` tool)
- [ ] Cost savings verified

---

## 🎯 Next Steps

### Immediate
1. **Restart Claude Code** to load the Qwen MCP server
2. **Test the qwen_max tool** with a simple prompt
3. **Monitor usage** in Alibaba Cloud console

### Within 24 Hours
- Use Qwen MCP server for SEO analysis tasks
- Compare response quality with Claude
- Track cost savings

### Within 1 Week
- Integrate Qwen MCP server into workflows
- Document common prompts and use cases
- Optimize temperature settings per task type

---

## 🎉 Benefits

✅ **Cost-optimized AI** - 91% cheaper than Claude Opus
✅ **High performance** - Qwen3-Max is Alibaba's top model
✅ **MCP integration** - Works directly in Claude Code
✅ **Large context** - 32K token window
✅ **Free quota** - 1M tokens to get started

---

**Status**: ✅ Installation complete, ready to use after Claude Code restart
**Model**: Qwen3-Max (qwen-max-latest)
**Cost**: $1.60 input / $6.40 output per 1M tokens
**Integration**: MCP tool (`qwen_max`)

🚀 **Qwen MCP Server is ready! Restart Claude Code to start using it!**
