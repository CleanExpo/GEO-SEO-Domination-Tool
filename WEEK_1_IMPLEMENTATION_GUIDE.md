# Week 1 Implementation Guide - Most Efficient Path

**Goal:** Get Qwen3-Omni working with MetaCoder Orchestrator in <2 hours (vs 6+ hours for local models)

---

## Option 1: DashScope API (RECOMMENDED for Week 1) ⚡

**Time to Working System:** ~30 minutes
**Storage Required:** 0 GB
**GPU Required:** None
**Cost:** Pay-as-you-go (~$0.06/query)

### Step 1: Get DashScope API Key (5 minutes)

```bash
# 1. Visit: https://dashscope.console.aliyun.com/
# 2. Sign up for Alibaba Cloud account
# 3. Enable DashScope service
# 4. Generate API key from console
# 5. Add to .env.local
```

**Add to `web-app/.env.local`:**
```env
# Qwen3-Omni via DashScope API
DASHSCOPE_API_KEY=sk-your-api-key-here
QWEN_OMNI_MODEL=qwen3-omni-30b-a3b-instruct
QWEN_OMNI_VOICE_MODEL=qwen3-omni-30b-a3b-talker
```

### Step 2: Install DashScope SDK (2 minutes)

```bash
pip install dashscope
```

### Step 3: Create Qwen API Client (10 minutes)

**File:** `web-app/services/api/qwen-omni.ts`

```typescript
// web-app/services/api/qwen-omni.ts
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export interface QwenVoiceRequest {
  audioBuffer: Buffer
  language?: string
}

export interface QwenVoiceResponse {
  transcription: string
  intent: string
  parameters: Record<string, any>
  audioResponse?: Buffer
}

export class Qwen3OmniClient {
  private apiKey: string
  private model: string

  constructor() {
    this.apiKey = process.env.DASHSCOPE_API_KEY!
    this.model = process.env.QWEN_OMNI_MODEL || 'qwen3-omni-30b-a3b-instruct'
  }

  /**
   * Analyze voice command and extract intent
   */
  async analyzeVoiceCommand(audioBuffer: Buffer): Promise<QwenVoiceResponse> {
    // Call Python script that uses dashscope
    const audioPath = `/tmp/voice_input_${Date.now()}.wav`
    await fs.promises.writeFile(audioPath, audioBuffer)

    const { stdout } = await execAsync(
      `python scripts/qwen-voice-analysis.py "${audioPath}" "${this.apiKey}"`
    )

    const result = JSON.parse(stdout)
    return result
  }

  /**
   * Generate natural speech response
   */
  async generateSpeech(text: string, language: string = 'en'): Promise<Buffer> {
    const { stdout } = await execAsync(
      `python scripts/qwen-speech-generation.py "${text}" "${language}" "${this.apiKey}"`
    )

    const audioPath = stdout.trim()
    const audioBuffer = await fs.promises.readFile(audioPath)
    return audioBuffer
  }

  /**
   * Analyze video frames for UI patterns
   */
  async analyzeVideoFrames(
    frames: Buffer[],
    extractPatterns: string[]
  ): Promise<any> {
    // Save frames temporarily
    const framePaths = await Promise.all(
      frames.map(async (frame, i) => {
        const path = `/tmp/frame_${i}.png`
        await fs.promises.writeFile(path, frame)
        return path
      })
    )

    const { stdout } = await execAsync(
      `python scripts/qwen-video-analysis.py "${framePaths.join(',')}" "${extractPatterns.join(',')}" "${this.apiKey}"`
    )

    return JSON.parse(stdout)
  }
}
```

### Step 4: Create Python DashScope Scripts (10 minutes)

**File:** `scripts/qwen-voice-analysis.py`

```python
#!/usr/bin/env python3
import sys
import json
import dashscope
from dashscope import MultiModalConversation

def analyze_voice(audio_path, api_key):
    dashscope.api_key = api_key

    # Upload audio file
    with open(audio_path, 'rb') as f:
        audio_data = f.read()

    # Call Qwen3-Omni Instruct for intent extraction
    messages = [
        {
            'role': 'user',
            'content': [
                {'audio': audio_path},
                {'text': 'Transcribe this audio and extract: 1) The transcription, 2) The user intent, 3) Any parameters mentioned (like component names, features, etc.)'}
            ]
        }
    ]

    response = MultiModalConversation.call(
        model='qwen3-omni-30b-a3b-instruct',
        messages=messages
    )

    # Parse response
    result = {
        'transcription': response.output.choices[0].message.content[0].text,
        'intent': extract_intent(response.output.choices[0].message.content[0].text),
        'parameters': extract_parameters(response.output.choices[0].message.content[0].text)
    }

    print(json.dumps(result))

def extract_intent(text):
    # Simple intent extraction (can be improved)
    if 'create' in text.lower() or 'build' in text.lower():
        return 'generate_component'
    elif 'test' in text.lower():
        return 'run_test'
    elif 'deploy' in text.lower():
        return 'deploy'
    else:
        return 'unknown'

def extract_parameters(text):
    # Extract parameters from text
    params = {}
    # Add extraction logic here
    return params

if __name__ == '__main__':
    audio_path = sys.argv[1]
    api_key = sys.argv[2]
    analyze_voice(audio_path, api_key)
```

**File:** `scripts/qwen-speech-generation.py`

```python
#!/usr/bin/env python3
import sys
import dashscope
from dashscope import MultiModalConversation

def generate_speech(text, language, api_key):
    dashscope.api_key = api_key

    # Call Qwen3-Omni Talker
    messages = [
        {
            'role': 'user',
            'content': [
                {'text': f'Generate natural speech in {language} for: {text}'}
            ]
        }
    ]

    response = MultiModalConversation.call(
        model='qwen3-omni-30b-a3b-talker',
        messages=messages,
        stream=False
    )

    # Save audio response
    audio_path = f'/tmp/speech_output_{int(time.time())}.wav'
    with open(audio_path, 'wb') as f:
        f.write(response.output.choices[0].message.audio)

    print(audio_path)

if __name__ == '__main__':
    text = sys.argv[1]
    language = sys.argv[2]
    api_key = sys.argv[3]
    generate_speech(text, language, api_key)
```

### Step 5: Test Voice Integration (5 minutes)

```typescript
// Test script
import { Qwen3OmniClient } from './services/api/qwen-omni'
import fs from 'fs'

async function test() {
  const qwen = new Qwen3OmniClient()

  // Test 1: Voice command analysis
  const audioBuffer = fs.readFileSync('test-audio.wav')
  const result = await qwen.analyzeVoiceCommand(audioBuffer)
  console.log('Voice Analysis:', result)

  // Test 2: Speech generation
  const audioResponse = await qwen.generateSpeech(
    "I've created the ranking widget. It's now available in the preview.",
    'en'
  )
  console.log('Generated speech:', audioResponse.length, 'bytes')
}

test()
```

**Total Time: ~30 minutes to working voice integration**

---

## Option 2: Local Models (NOT RECOMMENDED for Week 1) ⏳

**Time to Working System:** 6+ hours
**Storage Required:** 115 GB
**GPU Required:** NVIDIA GPU with 80GB VRAM (A100)
**Cost:** $18,000+ hardware

### Why NOT to do this in Week 1:

1. **100GB download** - 2-4 hours on fast connection
2. **Model loading** - 5-10 minutes per model
3. **GPU requirement** - Most systems don't have 80GB VRAM
4. **Complexity** - More moving parts, more potential issues
5. **No real-time streaming** - Harder to implement voice features

### When to Consider Local Models:

- After Week 6 when system is working
- If usage exceeds 3000 queries/month
- If data privacy is critical
- If you have the hardware

---

## Recommended Week 1 Timeline (DashScope Path)

### Day 1 (Today): API Setup ✅
- [x] Install transformers (DONE)
- [x] Install qwen-omni-utils (DONE)
- [ ] Get DashScope API key
- [ ] Install dashscope SDK
- [ ] Test basic API call

### Day 2: Voice Integration
- [ ] Create Qwen3OmniClient class
- [ ] Create Python helper scripts
- [ ] Test voice command analysis
- [ ] Test speech generation

### Day 3: MetaCoder Integration
- [ ] Connect Qwen to Router Agent
- [ ] Implement voice → intent routing
- [ ] Test voice → code generation workflow

### Day 4: Database Migration
- [ ] Run sandbox-schema.sql on Supabase
- [ ] Test session creation
- [ ] Test voice command logging

### Day 5: End-to-End Test
- [ ] Voice command → Component generation → Speech response
- [ ] Document any issues
- [ ] Optimize performance

---

## Cost Comparison

### DashScope API (Week 1 Testing)

**Estimated usage during development:**
- 100 test queries × $0.06 = $6.00
- Voice generation: 100 responses × $0.02 = $2.00
- **Total Week 1: ~$8.00**

### Local Models

**One-time costs:**
- NVIDIA A100 80GB: $18,000
- Server infrastructure: $7,000
- **Total: $25,000**

**Recommendation:** Start with DashScope API ($8), only move to local if usage justifies $25K investment.

---

## Next Command to Run

```bash
# Install DashScope SDK
pip install dashscope

# Test if it works
python -c "import dashscope; print('✅ DashScope SDK installed')"
```

Then create API account at: https://dashscope.console.aliyun.com/

---

## Summary

**Most Efficient Path = DashScope API**

✅ **Pros:**
- 30 minutes to working system (vs 6+ hours)
- No 100GB download
- No GPU required
- Real-time streaming works
- $8 for Week 1 testing

❌ **Cons:**
- API dependency
- Recurring costs (~$400/month at scale)

**Decision:** Start with DashScope, evaluate local models after Week 6 if usage is high.

This gets you from zero to working voice-enabled MetaCoder in <2 hours instead of >6 hours! 🚀
