# Claude SDK Documentation

Source: https://docs.claude.com/en/api/client-sdks

## Official Client SDKs

Claude provides official client SDKs for multiple programming languages:
- **Python** - Full-featured SDK
- **TypeScript/JavaScript** - Node.js and browser support
- **Java** - Enterprise support
- **Go** - High-performance applications
- **C#** (beta) - .NET applications
- **Ruby** - Rails integration
- **PHP** (beta) - Web applications

## Key SDK Features

- Easy API key configuration
- Support for multiple Claude models
- Simple message creation methods
- Consistent interface across languages
- Streaming support
- Tool/function calling
- Vision capabilities (image analysis)
- Extended thinking mode
- Prompt caching

## Installation

### Python
```bash
pip install anthropic
```

### TypeScript/JavaScript
```bash
npm install @anthropic-ai/sdk
```

### Go
```bash
go get github.com/anthropics/anthropic-sdk-go
```

### Java
```xml
<dependency>
    <groupId>com.anthropic</groupId>
    <artifactId>sdk</artifactId>
    <version>0.1.0</version>
</dependency>
```

## Common SDK Usage Pattern

1. **Initialize client with API key**
2. **Create messages using specific model**
3. **Execute and retrieve response**

### Python Example

```python
import anthropic

client = anthropic.Anthropic(
    api_key="sk-ant-...",  # or use ANTHROPIC_API_KEY env var
)

message = client.messages.create(
    model="claude-sonnet-4-20250514",
    max_tokens=1024,
    messages=[
        {"role": "user", "content": "Hello, Claude"}
    ]
)

print(message.content)
```

### TypeScript Example

```typescript
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const message = await client.messages.create({
  model: 'claude-sonnet-4-20250514',
  max_tokens: 1024,
  messages: [
    { role: 'user', content: 'Hello, Claude' }
  ]
});

console.log(message.content);
```

## Beta Namespace

Each SDK includes a `beta` namespace for experimental features:

```python
# Python
from anthropic import Anthropic

client = Anthropic()

# Access beta features
response = client.beta.messages.create(
    model="claude-sonnet-4-20250514",
    max_tokens=1024,
    betas=["extended-thinking-2025-01-01"],
    messages=[{"role": "user", "content": "Solve this problem..."}]
)
```

```typescript
// TypeScript
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

// Access beta features
const response = await client.beta.messages.create({
  model: 'claude-sonnet-4-20250514',
  max_tokens: 1024,
  betas: ['extended-thinking-2025-01-01'],
  messages: [{ role: 'user', content: 'Solve this problem...' }]
});
```

## Supported Models

Latest Claude models:
- `claude-sonnet-4-20250514` (Claude 4 Sonnet - latest)
- `claude-opus-4-20250514` (Claude 4 Opus - most capable)
- `claude-3-7-sonnet-20250219` (Claude 3.7 Sonnet)
- `claude-3-5-sonnet-20241022` (Claude 3.5 Sonnet)
- `claude-3-5-haiku-20241022` (Claude 3.5 Haiku - fastest)

Model aliases:
- `claude-4-sonnet-latest`
- `claude-4-opus-latest`
- `claude-3-7-sonnet-latest`

## Advanced Features

### Streaming Responses

```python
# Python
with client.messages.stream(
    model="claude-sonnet-4-20250514",
    max_tokens=1024,
    messages=[{"role": "user", "content": "Write a story"}]
) as stream:
    for text in stream.text_stream:
        print(text, end="", flush=True)
```

```typescript
// TypeScript
const stream = await client.messages.create({
  model: 'claude-sonnet-4-20250514',
  max_tokens: 1024,
  stream: true,
  messages: [{ role: 'user', content: 'Write a story' }]
});

for await (const event of stream) {
  if (event.type === 'content_block_delta' &&
      event.delta.type === 'text_delta') {
    process.stdout.write(event.delta.text);
  }
}
```

### Tool/Function Calling

```python
# Python
message = client.messages.create(
    model="claude-sonnet-4-20250514",
    max_tokens=1024,
    tools=[
        {
            "name": "get_weather",
            "description": "Get current weather for a location",
            "input_schema": {
                "type": "object",
                "properties": {
                    "location": {"type": "string"}
                },
                "required": ["location"]
            }
        }
    ],
    messages=[{"role": "user", "content": "What's the weather in SF?"}]
)

# Handle tool use
if message.stop_reason == "tool_use":
    tool_use = next(block for block in message.content if block.type == "tool_use")
    # Execute tool and continue conversation
```

### Vision (Image Analysis)

```python
# Python
import base64

with open("image.jpg", "rb") as f:
    image_data = base64.standard_b64encode(f.read()).decode("utf-8")

message = client.messages.create(
    model="claude-sonnet-4-20250514",
    max_tokens=1024,
    messages=[{
        "role": "user",
        "content": [
            {
                "type": "image",
                "source": {
                    "type": "base64",
                    "media_type": "image/jpeg",
                    "data": image_data,
                }
            },
            {
                "type": "text",
                "text": "What's in this image?"
            }
        ]
    }]
)
```

### Prompt Caching

```python
# Python
message = client.messages.create(
    model="claude-sonnet-4-20250514",
    max_tokens=1024,
    system=[
        {
            "type": "text",
            "text": "You are an AI assistant...",
            "cache_control": {"type": "ephemeral"}
        }
    ],
    messages=[{"role": "user", "content": "Question 1"}]
)

# Subsequent requests reuse cached system prompt
message2 = client.messages.create(
    model="claude-sonnet-4-20250514",
    max_tokens=1024,
    system=[
        {
            "type": "text",
            "text": "You are an AI assistant...",  # Same as before
            "cache_control": {"type": "ephemeral"}
        }
    ],
    messages=[{"role": "user", "content": "Question 2"}]
)
```

## Error Handling

```python
# Python
from anthropic import APIError, APIConnectionError, RateLimitError

try:
    message = client.messages.create(...)
except RateLimitError as e:
    print(f"Rate limit exceeded: {e}")
except APIConnectionError as e:
    print(f"Connection error: {e}")
except APIError as e:
    print(f"API error: {e}")
```

```typescript
// TypeScript
import { APIError, APIConnectionError, RateLimitError } from '@anthropic-ai/sdk';

try {
  const message = await client.messages.create(...);
} catch (error) {
  if (error instanceof RateLimitError) {
    console.error('Rate limit exceeded:', error);
  } else if (error instanceof APIConnectionError) {
    console.error('Connection error:', error);
  } else if (error instanceof APIError) {
    console.error('API error:', error);
  }
}
```

## Configuration Options

```python
# Python
client = Anthropic(
    api_key="sk-ant-...",
    base_url="https://api.anthropic.com",  # Custom base URL
    timeout=60.0,  # Request timeout in seconds
    max_retries=2,  # Automatic retry on failures
)
```

```typescript
// TypeScript
const client = new Anthropic({
  apiKey: 'sk-ant-...',
  baseURL: 'https://api.anthropic.com',  // Custom base URL
  timeout: 60000,  // Request timeout in milliseconds
  maxRetries: 2,  // Automatic retry on failures
});
```

## Best Practices

1. **Store API keys securely** - Use environment variables, never hardcode
2. **Handle errors gracefully** - Implement retry logic and fallbacks
3. **Use streaming for long responses** - Better UX for real-time output
4. **Cache prompts when possible** - Reduce costs for repeated system prompts
5. **Set appropriate timeouts** - Balance reliability vs. performance
6. **Monitor token usage** - Track costs and optimize prompts
7. **Use specific model versions** - Avoid breaking changes with "latest" aliases

## SDK Links

- **Python**: https://github.com/anthropics/anthropic-sdk-python
- **TypeScript**: https://github.com/anthropics/anthropic-sdk-typescript
- **Go**: https://github.com/anthropics/anthropic-sdk-go
- **Java**: https://github.com/anthropics/anthropic-sdk-java
- **C#**: https://github.com/anthropics/anthropic-sdk-dotnet
- **Ruby**: https://github.com/anthropics/anthropic-sdk-ruby
- **PHP**: https://github.com/anthropics/anthropic-sdk-php

## Additional Resources

- [API Reference](https://docs.anthropic.com/en/api/messages)
- [Prompt Engineering Guide](https://docs.anthropic.com/en/docs/prompt-engineering)
- [Vision Guide](https://docs.anthropic.com/en/docs/vision)
- [Tool Use Guide](https://docs.anthropic.com/en/docs/tool-use)
- [Streaming Guide](https://docs.anthropic.com/en/docs/streaming)
