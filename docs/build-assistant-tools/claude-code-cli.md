# Claude Code CLI Reference

## Overview
Claude Code CLI is the command-line interface for interacting with Claude AI in development environments. It provides powerful tools for coding assistance, automated tasks, and AI-powered development workflows.

## Basic Commands

### Interactive REPL
```bash
# Start interactive session
claude

# Start with initial prompt
claude "explain this codebase"

# Query and exit (no REPL)
claude -p "what files are in this directory?"
```

### Version Management
```bash
# Update to latest version
claude update
```

## Conversation Management

### Continue Conversations
```bash
# Continue most recent conversation
claude -c

# Resume specific session by ID
claude -r "<session-id>" "continue working on auth"

# Shorthand for continue
claude --continue
```

### Session IDs
- Unique identifier for each conversation
- Used to resume specific contexts
- Stored in conversation history

## Core Flags and Options

### Working Directory
```bash
# Add working directories
claude --add-dir /path/to/project

# Multiple directories
claude --add-dir /path/one --add-dir /path/two
```

### Model Selection
```bash
# Specify model for session
claude --model sonnet

# Available models:
# - opus (most capable)
# - sonnet (balanced)
# - haiku (fastest)
```

### Output Modes
```bash
# Print response without interactive mode
claude -p "query"
claude --print "query"

# Output formats
--output-format text           # Human-readable (default)
--output-format json           # Structured JSON
--output-format stream-json    # Streaming JSON
```

## Advanced Features

### Tool Control
```bash
# Specify allowed tools only
claude --allowedTools Read,Write,Bash

# Block specific tools
claude --disallowedTools WebFetch,WebSearch

# Common tools:
# - Read, Write, Edit
# - Bash, Glob, Grep
# - WebFetch, WebSearch
# - Task (for subagents)
```

### Agentic Behavior
```bash
# Limit maximum autonomous turns
claude --max-turns 10

# Verbose logging
claude --verbose

# Permission modes
claude --permission-mode strict    # Ask for all actions
claude --permission-mode auto      # Auto-approve safe actions
```

## Subagent System

### What Are Subagents?
Specialized AI agents with specific roles, tools, and prompts for targeted tasks.

### Defining Subagents
```bash
# Define subagent inline
claude --agents '{
  "code-reviewer": {
    "description": "Expert code reviewer",
    "prompt": "You are a senior code reviewer with expertise in best practices",
    "tools": ["Read", "Grep", "Edit"],
    "model": "sonnet"
  }
}'
```

### Subagent Configuration Structure
```json
{
  "agent-name": {
    "description": "Brief description for Claude to know when to use this agent",
    "prompt": "System prompt defining the agent's role and expertise",
    "tools": ["Tool1", "Tool2"],  // Optional: restrict to specific tools
    "model": "sonnet"              // Optional: specify model
  }
}
```

### Example Subagents

#### Code Reviewer
```json
{
  "code-reviewer": {
    "description": "Reviews code for quality, security, and best practices",
    "prompt": "You are a senior code reviewer. Focus on: code quality, security vulnerabilities, performance issues, and best practices. Provide specific, actionable feedback.",
    "tools": ["Read", "Grep", "Edit"],
    "model": "sonnet"
  }
}
```

#### Test Writer
```json
{
  "test-writer": {
    "description": "Writes comprehensive unit and integration tests",
    "prompt": "You are a test automation expert. Write thorough, maintainable tests with good coverage. Follow testing best practices and include edge cases.",
    "tools": ["Read", "Write", "Bash"],
    "model": "sonnet"
  }
}
```

#### Documentation Expert
```json
{
  "doc-expert": {
    "description": "Creates and maintains technical documentation",
    "prompt": "You are a technical writer. Create clear, comprehensive documentation that is easy to understand. Include examples, use cases, and best practices.",
    "tools": ["Read", "Write", "Glob", "Grep"],
    "model": "haiku"
  }
}
```

### Using Subagents
```bash
# Claude automatically invokes appropriate subagent based on task
claude "review the auth module"  # Uses code-reviewer
claude "write tests for user service"  # Uses test-writer
claude "document the API"  # Uses doc-expert
```

## Configuration Files

### Location
```
# macOS/Linux
~/.config/claude-code/config.json

# Windows
%APPDATA%/Claude/config.json
```

### Example Configuration
```json
{
  "defaultModel": "sonnet",
  "maxTurns": 20,
  "permissionMode": "auto",
  "allowedTools": ["Read", "Write", "Edit", "Bash", "Grep", "Glob"],
  "subagents": {
    "code-reviewer": { /* config */ },
    "test-writer": { /* config */ }
  }
}
```

## Environment Variables

```bash
# API Key (required)
export ANTHROPIC_API_KEY="your-api-key"

# Custom API endpoint
export ANTHROPIC_API_URL="https://custom-endpoint.com"

# Debug mode
export CLAUDE_DEBUG=true

# Custom config location
export CLAUDE_CONFIG_PATH="/custom/path/config.json"
```

## Scripting and Automation

### Non-Interactive Usage
```bash
# Single query (print mode)
claude -p "list all TypeScript files"

# JSON output for parsing
claude -p --output-format json "analyze dependencies"

# Pipe to other commands
claude -p "list todos" | grep "urgent"
```

### Batch Processing
```bash
# Process multiple prompts
for file in src/*.ts; do
  claude -p "review $file" >> review-report.txt
done

# Automated code generation
claude -p "generate API client for spec.yaml" > api-client.ts
```

## Best Practices

### 1. Use Appropriate Models
- **Opus**: Complex reasoning, architecture decisions
- **Sonnet**: General coding, balanced performance
- **Haiku**: Simple tasks, fast responses

### 2. Leverage Subagents
- Define specialized agents for recurring tasks
- Restrict tools to minimum needed
- Use clear, focused prompts

### 3. Manage Conversations
- Use `--continue` for multi-turn workflows
- Resume specific sessions when needed
- Clear context between unrelated tasks

### 4. Tool Restrictions
- Limit tools for security-sensitive operations
- Use `--allowedTools` in automated scripts
- Block risky tools in production

### 5. Output Formatting
- Use `--print` for scripting
- JSON format for parsing
- Stream JSON for real-time processing

## Common Workflows

### Code Review Workflow
```bash
# Define reviewer subagent
claude --agents '{
  "reviewer": {
    "description": "Code reviewer",
    "prompt": "Review code for issues",
    "tools": ["Read", "Grep"]
  }
}'

# Start review
claude "review all files in src/"
```

### Testing Workflow
```bash
# Generate tests
claude -p "generate tests for src/auth.ts" > tests/auth.test.ts

# Run tests
npm test

# Fix failures
claude -c "fix failing tests"
```

### Documentation Workflow
```bash
# Generate docs
claude "document all exported functions in src/"

# Review and approve
claude -c "update based on review comments"
```

## Troubleshooting

### Common Issues

**API Key Not Found**
```bash
export ANTHROPIC_API_KEY="your-key"
```

**Permission Denied**
```bash
# Check file permissions
chmod +x $(which claude)
```

**Conversation Not Found**
```bash
# List recent conversations
claude --list-sessions

# Resume correct session
claude -r "<correct-session-id>"
```

### Debug Mode
```bash
# Enable verbose logging
claude --verbose "query"

# Set debug environment
export CLAUDE_DEBUG=true
```

## Integration Examples

### With Git
```bash
# Review changes before commit
git diff | claude -p "review these changes"

# Generate commit message
claude -p "generate commit message for: $(git diff --staged)"
```

### With CI/CD
```bash
# Automated code review
claude -p --output-format json "review PR changes" > review.json

# Parse results
jq '.issues[] | select(.severity == "high")' review.json
```

### With IDEs
```bash
# VSCode task
{
  "label": "Claude Review",
  "type": "shell",
  "command": "claude -p 'review current file'"
}
```

## Advanced Techniques

### Multi-Agent Orchestration
```bash
# Define multiple specialized agents
claude --agents '{
  "architect": { /* system design */ },
  "implementer": { /* coding */ },
  "tester": { /* testing */ }
}' "build auth system"
```

### Context Management
```bash
# Add multiple context directories
claude --add-dir /api --add-dir /frontend --add-dir /shared

# Query with full context
claude "how do api and frontend communicate?"
```

### Custom Workflows
```bash
# Create alias for common workflow
alias review="claude --agents code-reviewer.json --allowedTools Read,Grep -p"

# Use it
review "check security in src/"
```

## Performance Optimization

### Reduce Latency
- Use Haiku for simple tasks
- Limit `--max-turns` for deterministic tasks
- Use `--print` to skip interactive overhead

### Manage Costs
- Choose appropriate model for task complexity
- Use tool restrictions to reduce API calls
- Batch similar requests when possible

## Security Considerations

### API Key Protection
```bash
# Never commit API keys
echo "ANTHROPIC_API_KEY" >> .gitignore

# Use environment-specific keys
export ANTHROPIC_API_KEY_PROD="prod-key"
export ANTHROPIC_API_KEY_DEV="dev-key"
```

### Tool Safety
```bash
# Restrict dangerous operations
claude --disallowedTools Bash,WebFetch

# Require approval for file writes
claude --permission-mode strict
```

## Quick Reference

```bash
# Common commands
claude                          # Start REPL
claude -c                       # Continue last conversation
claude -p "query"              # Print response and exit
claude update                  # Update CLI

# Common flags
--model sonnet                 # Set model
--allowedTools Read,Write      # Restrict tools
--max-turns 10                 # Limit autonomy
--verbose                      # Debug logging
--add-dir /path               # Add context

# Output formats
--output-format text           # Human-readable
--output-format json           # Structured data
--output-format stream-json    # Streaming
```

---
**Source**: https://docs.claude.com/en/docs/claude-code/cli-reference
**Version**: Latest
**Last Updated**: 2025-01-03
