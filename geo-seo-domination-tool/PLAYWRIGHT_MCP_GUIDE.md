# Playwright MCP Integration Guide

## What is Playwright MCP?

The Playwright Model Context Protocol (MCP) server provides AI agents with browser automation capabilities using Playwright's accessibility tree, bypassing the need for screenshots or visually-tuned models.

**GitHub:** https://github.com/microsoft/playwright-mcp
**NPM:** @playwright/mcp

---

## ✅ Already Configured

This project has been set up with Playwright MCP support:

- ✅ **Claude Code** - Added locally via `claude mcp add`
- ✅ **VS Code** - Configuration in `.vscode/mcp.json`
- ✅ **Service Wrapper** - `src/services/playwright-mcp.ts`
- ✅ **Multi-browser Support** - Chrome, Firefox, WebKit, Edge

---

## Key Features

### Fast and Lightweight
- Uses Playwright's **accessibility tree**, not pixel-based input
- No vision models needed
- Operates purely on structured data
- Deterministic tool application

### Multi-Browser Support
- **Chrome** / Chromium (default)
- **Firefox** - Cross-browser testing
- **WebKit** - Safari engine
- **Microsoft Edge** - Chromium-based

### Advanced Capabilities (Opt-in)
- **Vision** (`--caps=vision`) - Screenshots and coordinate-based interactions
- **PDF** (`--caps=pdf`) - PDF generation from pages
- **Verify** (`--caps=verify`) - Assertions and expectations
- **Tracing** (`--caps=tracing`) - Playwright trace recording

---

## Setup for Different AI Agents

### Claude Code (Already Done ✅)

The MCP server has been added to your local Claude Code configuration:

```bash
claude mcp add playwright -- npx @playwright/mcp@latest
```

**With custom configuration:**
```bash
claude mcp add playwright -- npx @playwright/mcp@latest \
  --browser chrome \
  --headless \
  --caps vision,pdf
```

**Usage:**
Just write prompts in Claude Code! For example:
```
Navigate to example.com and extract all product titles
```

---

### VS Code (Already Done ✅)

MCP configuration file created at `.vscode/mcp.json`:

```json
{
  "$schema": "https://modelcontextprotocol.io/schema/mcp.json",
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["@playwright/mcp@latest"]
    }
  }
}
```

**With advanced options:**
```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": [
        "@playwright/mcp@latest",
        "--browser", "chrome",
        "--headless",
        "--viewport-size", "1920x1080",
        "--caps", "vision,pdf",
        "--save-trace"
      ]
    }
  }
}
```

**Usage:**
1. Open VS Code in this project
2. MCP server auto-starts
3. Use AI features with browser automation

---

### Cursor

Add to `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["@playwright/mcp@latest"]
    }
  }
}
```

---

### Windsurf

Add to `mcp_config.json`:

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["@playwright/mcp@latest"]
    }
  }
}
```

---

### Claude Desktop

Add to Claude Desktop config:

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["@playwright/mcp@latest"]
    }
  }
}
```

---

## Available Tools

### Core Automation
- `playwright_navigate` - Navigate to URL
- `playwright_click` - Click element
- `playwright_fill` - Fill input field
- `playwright_select` - Select dropdown option
- `playwright_hover` - Hover over element
- `playwright_press` - Press keyboard key
- `playwright_type` - Type text
- `playwright_snapshot` - Get accessibility tree snapshot

### Tab Management
- `playwright_open_tab` - Open new tab
- `playwright_close_tab` - Close tab
- `playwright_switch_tab` - Switch between tabs

### Vision (requires `--caps=vision`)
- `playwright_screenshot` - Take full page screenshot
- `playwright_screenshot_element` - Screenshot specific element

### PDF (requires `--caps=pdf`)
- `playwright_pdf` - Generate PDF from page

### Verification (requires `--caps=verify`)
- `playwright_expect` - Assert element state
- `playwright_assert` - Verify conditions

### Tracing (requires `--caps=tracing`)
- `playwright_start_trace` - Start recording trace
- `playwright_stop_trace` - Stop and save trace

You don't need to call these directly - AI agents use them automatically!

---

## Configuration Options

### Browser Selection

```bash
--browser chrome      # Default
--browser firefox     # Mozilla Firefox
--browser webkit      # Safari engine
--browser msedge      # Microsoft Edge
```

### Display Mode

```bash
--headless           # Run without visible browser window
# Default is headed (visible browser)
```

### Viewport and Device

```bash
--viewport-size "1920x1080"    # Custom viewport
--device "iPhone 15"            # Device emulation
```

### Timeouts

```bash
--timeout-action 5000          # Action timeout (default: 5000ms)
--timeout-navigation 60000     # Navigation timeout (default: 60000ms)
```

### Capabilities

```bash
--caps vision                  # Enable screenshots
--caps pdf                     # Enable PDF generation
--caps verify                  # Enable assertions
--caps tracing                 # Enable trace recording
--caps vision,pdf,verify       # Multiple capabilities
```

### Session Management

```bash
--isolated                     # Clean state for each session
--user-data-dir /path/to/dir  # Persistent profile directory
--storage-state /path/to/state.json  # Initial cookies/localStorage
```

### Recording and Debugging

```bash
--save-trace                   # Save Playwright trace
--save-video "800x600"         # Record video at specified size
--output-dir /path/to/output   # Output directory for files
```

### Network

```bash
--proxy-server "http://proxy:3128"  # HTTP proxy
--ignore-https-errors               # Ignore SSL errors
--block-service-workers             # Block service workers
```

---

## Persistent vs Isolated Sessions

### Persistent (Default)

**Keeps browser profile between runs:**
- Saves login sessions
- Preserves cookies and local storage
- Maintains browser history

**Profile Locations:**
- **Windows:** `%USERPROFILE%\AppData\Local\ms-playwright\mcp-chrome-profile`
- **macOS:** `~/Library/Caches/ms-playwright/mcp-chrome-profile`
- **Linux:** `~/.cache/ms-playwright/mcp-chrome-profile`

**Delete profile to clear state:**
```bash
# Windows
rmdir /s "%USERPROFILE%\AppData\Local\ms-playwright\mcp-chrome-profile"

# macOS/Linux
rm -rf ~/Library/Caches/ms-playwright/mcp-chrome-profile
```

---

### Isolated

**Clean state for each session:**
- In-memory profile
- No persistent data
- Perfect for testing

**Enable with:**
```bash
npx @playwright/mcp@latest --isolated
```

**With initial state:**
```bash
npx @playwright/mcp@latest --isolated --storage-state auth.json
```

---

## Browser Extension (Chrome/Edge)

Connect to existing browser tabs using the **Playwright MCP Bridge** extension.

**Installation:**
1. Visit: https://github.com/microsoft/playwright-mcp/tree/main/extension
2. Install the extension in Chrome or Edge
3. Configure MCP with `--extension` flag

**Benefits:**
- Use existing logged-in sessions
- Connect to running browser tabs
- Leverage current browser state

**Configuration:**
```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["@playwright/mcp@latest", "--extension"]
    }
  }
}
```

---

## Example Use Cases

### 1. Web Scraping

**Prompt:**
```
Navigate to https://news.ycombinator.com and extract all article titles and URLs from the front page
```

**What happens:**
- AI agent navigates to Hacker News
- Uses accessibility tree to identify articles
- Extracts titles and links
- Returns structured data

---

### 2. Form Automation

**Prompt:**
```
Go to example.com/contact, fill in the form with name "John Doe", email "john@example.com", message "Hello", and submit
```

**What happens:**
- Navigates to contact page
- Identifies form fields
- Fills in provided data
- Clicks submit button
- Verifies submission

---

### 3. Multi-Step Workflow

**Prompt:**
```
Navigate to amazon.com, search for "wireless headphones", click the first result, add to cart, and take a screenshot of the cart page
```

**What happens:**
- Opens Amazon
- Uses search functionality
- Clicks first product
- Adds to cart
- Captures screenshot (requires --caps=vision)

---

### 4. Testing and Validation

**Prompt:**
```
Test the login flow on example.com/login with email "test@example.com" and password "testpass123", then verify the dashboard page loads
```

**What happens:**
- Navigates to login page
- Fills credentials
- Submits form
- Waits for dashboard
- Verifies successful login

---

### 5. SEO Analysis

**Prompt:**
```
Analyze example.com for SEO: check meta tags, heading structure, image alt texts, and identify any missing SEO elements
```

**What happens:**
- Navigates to page
- Extracts meta tags
- Analyzes heading hierarchy
- Checks image attributes
- Reports SEO issues

---

### 6. Cross-Browser Testing

**Prompt:**
```
Test the homepage layout in Chrome, Firefox, and WebKit, and report any visual differences
```

**What happens:**
- Opens page in all three browsers
- Compares accessibility trees
- Identifies layout differences
- Reports inconsistencies

---

## Example Prompts Library

### Web Automation
```
- "Navigate to google.com and search for 'playwright automation'"
- "Go to example.com, click the Sign In button, and fill the login form"
- "Open amazon.com and add the first product to cart"
- "Navigate to the contact page and fill out the contact form"
- "Click through a multi-step checkout process"
```

### Web Scraping
```
- "Extract all product names and prices from the e-commerce page"
- "Scrape article headlines and publication dates from the news site"
- "Get all email addresses and phone numbers from the contact page"
- "Extract data from a table and format as JSON"
- "Collect all image URLs from the gallery"
```

### Testing & Validation
```
- "Test the login flow with valid credentials and verify success"
- "Validate that all links on the page are not broken"
- "Check if the mobile menu works correctly on iPhone viewport"
- "Verify form validation shows errors for invalid inputs"
- "Test that search functionality returns results"
```

### Screenshots & PDFs (--caps=vision,pdf)
```
- "Take a full-page screenshot of the homepage"
- "Capture a screenshot of the pricing table element"
- "Generate a PDF of the entire documentation site"
- "Take screenshots of the page in desktop and mobile viewports"
- "Create a PDF report of the dashboard page"
```

### Multi-Browser Testing
```
- "Test the website in Chrome, Firefox, and WebKit"
- "Check layout differences across browsers"
- "Verify cross-browser compatibility of features"
- "Test website on different device emulations"
- "Compare rendering in headless and headed modes"
```

### SEO Analysis
```
- "Check if all pages have proper meta tags"
- "Verify that images have alt attributes"
- "Extract all heading tags (H1, H2, H3) from the page"
- "Check if the site has a sitemap and robots.txt"
- "Analyze page load performance and Core Web Vitals"
```

---

## Docker Support

Run Playwright MCP in Docker for consistent environments:

```bash
docker run -it --rm \
  -v $(pwd):/workspace \
  mcr.microsoft.com/playwright:latest \
  npx @playwright/mcp@latest
```

**With custom configuration:**
```bash
docker run -it --rm \
  -v $(pwd):/workspace \
  mcr.microsoft.com/playwright:latest \
  npx @playwright/mcp@latest \
  --browser firefox \
  --headless \
  --caps vision,pdf
```

---

## Programmatic Usage

For advanced use cases, you can use the service wrapper programmatically:

```typescript
import { createPlaywrightMCPService } from './services/playwright-mcp'

const playwright = createPlaywrightMCPService({
  browser: 'chrome',
  headless: true,
  capabilities: ['vision', 'pdf'],
  viewportSize: '1920x1080',
})

// Get configuration for VS Code
const vscodeConfig = playwright.getVSCodeConfig()

// Get example prompts
const examples = playwright.getExamplePrompts()
```

---

## Troubleshooting

### MCP Server Not Starting

**Check:**
1. Node.js 18+ is installed
2. Run `npx @playwright/mcp@latest --help` to verify installation
3. Check VS Code/Claude Code console for errors

---

### Browser Not Launching

**Solutions:**
1. Install Playwright browsers:
   ```bash
   npx playwright install
   ```

2. Use headless mode:
   ```bash
   npx @playwright/mcp@latest --headless
   ```

3. Check permissions (Linux):
   ```bash
   sudo chmod +x ~/.cache/ms-playwright/*/chrome-linux/chrome
   ```

---

### Timeout Errors

**Increase timeouts:**
```bash
npx @playwright/mcp@latest \
  --timeout-action 10000 \
  --timeout-navigation 120000
```

---

### Extension Not Connecting

**Verify:**
1. Extension installed in Chrome/Edge
2. Using `--extension` flag
3. Browser is running
4. Extension permissions granted

---

## Integration in Generated Projects

When generating new projects with the Project Generator:

1. Select a template (React + Vite, Next.js, etc.)
2. Check "Playwright MCP" in integrations
3. Generate project

**Auto-configured:**
- ✅ `.vscode/mcp.json` with Playwright MCP server
- ✅ `playwright-mcp.config.ts` with service wrapper
- ✅ `PLAYWRIGHT_MCP_SETUP.md` with instructions
- ✅ Ready to use in VS Code, Claude Code, Cursor

---

## Supported AI Clients

- ✅ Claude Code
- ✅ Claude Desktop
- ✅ VS Code
- ✅ Cursor
- ✅ Windsurf
- ✅ Goose
- ✅ LM Studio
- ✅ Gemini CLI
- ✅ Codex
- ✅ Qodo Gen

---

## Performance Tips

1. **Use headless mode** for faster execution
2. **Enable specific capabilities** only when needed
3. **Set appropriate timeouts** based on your site speed
4. **Use isolated mode** for parallel test sessions
5. **Leverage browser caching** with persistent profiles

---

## Support & Resources

**Documentation:**
- [Playwright MCP GitHub](https://github.com/microsoft/playwright-mcp)
- [Playwright Documentation](https://playwright.dev)
- [Model Context Protocol](https://modelcontextprotocol.io/)

**Need Help?**
- GitHub Issues: https://github.com/microsoft/playwright-mcp/issues
- Playwright Discord: https://discord.gg/playwright-807756831384403968

---

## Quick Start Checklist

- [x] Playwright MCP added to Claude Code
- [x] VS Code MCP configuration created
- [ ] Test with simple prompt: "Navigate to example.com and take a screenshot"
- [ ] Verify browser launches successfully
- [ ] Try web scraping: "Extract all links from hacker news"
- [ ] Test form automation
- [ ] Enable vision/pdf capabilities if needed
- [ ] Integrate into your workflow!

**You're all set! Start automating browsers with AI agents.** 🎭
