# DeepSeek V3.2-Exp Integration Guide

## Overview

The GEO-SEO Domination Tool now integrates **DeepSeek V3.2-Exp** as the primary AI model for cost-effective project generation, content planning, and SEO analysis. DeepSeek provides **50%+ cost savings** compared to GPT-4 while maintaining high-quality output through its innovative sparse attention architecture.

## Architecture

### Multi-Model AI Orchestration

```
┌─────────────────────────────────────────────────────────────┐
│                    AI Orchestrator                          │
│                                                             │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │  DeepSeek   │  │    Claude     │  │   Perplexity    │  │
│  │   V3.2-Exp  │  │  Sonnet 4.5   │  │      Sonar      │  │
│  ├─────────────┤  ├──────────────┤  ├──────────────────┤  │
│  │ Primary     │  │ Enhancement  │  │ Real-time Data  │  │
│  │ Generation  │  │ UI/UX Code   │  │ Competitive     │  │
│  │ (Low Cost)  │  │ (Medium)     │  │ Research (Low)  │  │
│  └─────────────┘  └──────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Model Selection Strategy

| Task Type | Primary Model | Enhancement | Cost Tier |
|-----------|--------------|-------------|-----------|
| Project Structure Generation | DeepSeek | Claude (optional) | Low |
| Content Outline Creation | DeepSeek | - | Low |
| Keyword Research & Clustering | DeepSeek | - | Low |
| Technical Audit Checklists | DeepSeek | - | Low |
| Competitor Analysis | Perplexity | DeepSeek | Low |
| Code Generation | Claude | - | Medium |
| UI/UX Enhancement | Claude | - | Medium |

## API Endpoints

### 1. Generate Project Structure

**Endpoint:** `POST /api/ai/generate-project`

**Request:**
```json
{
  "domain": "example.com",
  "industry": "Water Damage Restoration",
  "location": "Brisbane, QLD",
  "goals": [
    "Rank #1 for 'water damage restoration brisbane'",
    "Increase local pack visibility",
    "Generate 50+ qualified leads per month"
  ],
  "enhance": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "project": "{ comprehensive project structure JSON }",
    "metadata": {
      "primaryModel": "deepseek/deepseek-v3.2-exp",
      "enhancementModel": "claude-sonnet-4",
      "cost": 0.000234,
      "processingTime": 3421,
      "timestamp": "2025-10-05T12:00:00Z"
    }
  }
}
```

### 2. Generate Content Plan

**Endpoint:** `POST /api/ai/generate-content`

**Request:**
```json
{
  "topics": [
    "Emergency Water Damage Response Brisbane",
    "Mold Remediation After Flood Damage",
    "Insurance Claims for Water Damage"
  ],
  "industry": "Water Damage Restoration",
  "location": "Brisbane, QLD",
  "contentType": "blog"
}
```

### 3. Analyze Competitors

**Endpoint:** `POST /api/ai/analyze-competitors`

**Request:**
```json
{
  "competitors": [
    "competitor1.com.au",
    "competitor2.com.au",
    "competitor3.com.au"
  ],
  "domain": "example.com",
  "industry": "Water Damage Restoration",
  "location": "Brisbane, QLD"
}
```

### 4. Generate Keyword Strategy

**Endpoint:** `POST /api/ai/generate-keywords`

**Request:**
```json
{
  "seedKeywords": [
    "water damage",
    "flood restoration",
    "mold removal",
    "emergency plumbing"
  ],
  "industry": "Water Damage Restoration",
  "location": "Brisbane, QLD"
}
```

## Environment Variables

### Required

```bash
# OpenRouter API Key (provides access to DeepSeek V3.2-Exp)
OPENROUTER_API_KEY=sk-or-v1-...
```

### Optional (for enhanced workflows)

```bash
# Anthropic Claude API Key (for code generation and UI enhancement)
ANTHROPIC_API_KEY=sk-ant-...

# Perplexity API Key (for real-time competitive research)
PERPLEXITY_API_KEY=pplx-...
```

## Setup Instructions

### 1. Get OpenRouter API Key

1. Sign up at https://openrouter.ai/
2. Navigate to API Keys section
3. Create new API key
4. Copy the key (starts with `sk-or-v1-`)

### 2. Add to Vercel Environment Variables

**Production:**
```bash
# Via Vercel Dashboard:
# Settings → Environment Variables → Add New
OPENROUTER_API_KEY=sk-or-v1-YOUR_KEY_HERE
```

**Local Development:**
```bash
# In web-app/.env.local
OPENROUTER_API_KEY=sk-or-v1-YOUR_KEY_HERE
```

### 3. Verify Integration

```bash
# Test project generation
curl -X POST http://localhost:3004/api/ai/generate-project \
  -H "Content-Type: application/json" \
  -d '{
    "domain": "test.com",
    "industry": "Test Industry",
    "location": "Test City",
    "goals": ["Test goal"]
  }'
```

## Cost Analysis

### Pricing Comparison (per 1M tokens)

| Model | Input Cost | Output Cost | Use Case |
|-------|------------|-------------|----------|
| DeepSeek V3.2-Exp | ~$0.10 | ~$0.20 | Primary generation (50%+ savings) |
| GPT-4 Turbo | $10.00 | $30.00 | Complex reasoning (baseline) |
| Claude Sonnet 4.5 | $3.00 | $15.00 | Code/UI enhancement |
| Perplexity Sonar | $1.00 | $1.00 | Real-time research |

### Example Cost Breakdown

**Generating 100 SEO projects:**
- **With GPT-4 only:** ~$150
- **With DeepSeek primary + Claude enhancement:** ~$25 (83% savings)
- **With DeepSeek only:** ~$5 (97% savings)

## Integration Benefits

### 1. Cost Efficiency
- **50%+ reduction** in AI inference costs
- Scalable bulk generation without budget constraints
- Predictable pricing for high-volume workflows

### 2. Performance
- **Sparse attention architecture** for efficient long-context processing
- Fast inference times (~3-5 seconds for project generation)
- Optimized for structured output (JSON, markdown)

### 3. Quality
- Performance on par with GPT-4 for structured tasks
- Enhanced with Claude for code generation
- Multi-model orchestration for optimal results

### 4. Flexibility
- Easy model switching via orchestrator
- Fallback mechanisms for reliability
- Per-task model selection based on requirements

## Usage Examples

### Example 1: Cost-Effective Project Generation

```typescript
import { AIOrchestrator } from '@/services/api/ai-orchestrator';

const orchestrator = new AIOrchestrator(
  process.env.OPENROUTER_API_KEY!,
  process.env.ANTHROPIC_API_KEY,
  process.env.PERPLEXITY_API_KEY
);

// Generate project structure with DeepSeek (low cost)
const result = await orchestrator.generateProject(
  'waterdamagebrisbane.com.au',
  'Water Damage Restoration',
  'Brisbane, QLD',
  ['Rank #1 for water damage restoration', 'Generate 50+ leads/month'],
  { enhance: false } // Use DeepSeek only for maximum savings
);

console.log(`Cost: $${result.cost} | Time: ${result.processingTime}ms`);
```

### Example 2: Enhanced Generation with Claude

```typescript
// Generate project + enhance with Claude for engineering depth
const enhancedResult = await orchestrator.generateProject(
  'waterdamagebrisbane.com.au',
  'Water Damage Restoration',
  'Brisbane, QLD',
  ['Technical architecture', 'Advanced SEO automation'],
  { enhance: true } // Add Claude enhancement layer
);

console.log(`Models: ${enhancedResult.primaryModel} + ${enhancedResult.enhancementModel}`);
```

### Example 3: Batch Content Generation

```typescript
// Generate 50 content outlines efficiently
const contentResult = await orchestrator.generateContentPlan(
  [
    'Emergency Water Damage Response',
    'Flood Damage Insurance Claims',
    // ... 48 more topics
  ],
  'Water Damage Restoration',
  'Brisbane, QLD',
  'blog'
);

const costAnalysis = orchestrator.getCostAnalysis([contentResult]);
console.log(`Total cost: $${costAnalysis.total}`);
console.log(`Savings vs GPT-4: $${costAnalysis.savings}`);
```

## Monitoring & Analytics

### Cost Tracking

The `AIOrchestrator` provides built-in cost analysis:

```typescript
const results = await orchestrator.processBatch(tasks);
const analysis = orchestrator.getCostAnalysis(results);

console.log(`Total cost: $${analysis.total}`);
console.log(`Cost by model:`, analysis.byModel);
console.log(`Savings vs GPT-4: $${analysis.savings}`);
```

### Performance Metrics

Each API response includes metadata:

```json
{
  "metadata": {
    "primaryModel": "deepseek/deepseek-v3.2-exp",
    "cost": 0.000234,
    "processingTime": 3421,
    "timestamp": "2025-10-05T12:00:00Z"
  }
}
```

## Troubleshooting

### Error: OPENROUTER_API_KEY not configured

**Solution:**
1. Verify environment variable is set in Vercel
2. Redeploy application after adding env var
3. Check `.env.local` for local development

### Error: Rate limit exceeded

**Solution:**
- OpenRouter provides generous rate limits
- Implement exponential backoff in orchestrator
- Consider upgrading OpenRouter tier if needed

### Error: Model not available

**Solution:**
- Verify DeepSeek V3.2-Exp is available on OpenRouter
- Check OpenRouter status page
- Fallback to alternative models via orchestrator

## Future Enhancements

### Planned Features
- [ ] Streaming responses for long-form content
- [ ] Fine-tuned DeepSeek models for SEO domain
- [ ] Advanced caching layer for repeated queries
- [ ] A/B testing framework for model selection
- [ ] Cost optimization dashboards
- [ ] Batch processing optimization

## Resources

- **DeepSeek Docs:** https://api-docs.deepseek.com/
- **OpenRouter Dashboard:** https://openrouter.ai/dashboard
- **Technical Report:** https://github.com/deepseek-ai/DeepSeek-V3.2-Exp
- **Feedback:** https://feedback.deepseek.com/dsa

## Support

For integration issues:
1. Check environment variables in Vercel
2. Review API endpoint responses for error details
3. Monitor cost and performance metrics
4. Submit issues to GitHub repository
