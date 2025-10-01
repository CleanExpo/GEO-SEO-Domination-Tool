/**
 * Playwright MCP Service
 *
 * Wrapper for Playwright Model Context Protocol (MCP) server
 * Provides browser automation capabilities using accessibility tree
 *
 * GitHub: https://github.com/microsoft/playwright-mcp
 * NPM: @playwright/mcp
 *
 * Key Features:
 * - Fast and lightweight (uses accessibility tree, not screenshots)
 * - LLM-friendly structured data
 * - Deterministic tool application
 * - Multi-browser support (Chrome, Firefox, WebKit)
 * - Network interception and mocking
 */

export interface PlaywrightMCPConfig {
  browser?: 'chrome' | 'firefox' | 'webkit' | 'msedge'
  headless?: boolean
  viewportSize?: string // e.g., "1280x720"
  userAgent?: string
  device?: string // e.g., "iPhone 15"
  timeout?: number
  isolated?: boolean
  saveTrace?: boolean
  saveVideo?: string
  capabilities?: ('vision' | 'pdf' | 'verify' | 'tracing')[]
}

export interface PlaywrightMCPResponse {
  success: boolean
  data?: any
  error?: string
}

export class PlaywrightMCPService {
  private config: PlaywrightMCPConfig

  constructor(config: PlaywrightMCPConfig = {}) {
    this.config = config
  }

  /**
   * Core Browser Automation Prompts
   *
   * Example AI prompts:
   * - "Navigate to example.com and click the login button"
   * - "Fill in the form with email and password, then submit"
   * - "Scrape all product titles from the e-commerce page"
   * - "Take a screenshot of the current page"
   * - "Wait for the page to fully load and extract all links"
   */
  async queryAutomation(prompt: string): Promise<PlaywrightMCPResponse> {
    try {
      return {
        success: true,
        data: {
          message: `MCP Query: ${prompt}`,
          note: 'Execute this in your AI agent with Playwright MCP enabled',
        },
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }

  /**
   * Web Scraping Prompts
   *
   * Example AI prompts:
   * - "Extract all article headlines from the news website"
   * - "Get pricing information from the product page"
   * - "Scrape contact information from the about page"
   * - "Extract table data and convert to JSON"
   */
  async queryScraping(prompt: string): Promise<PlaywrightMCPResponse> {
    try {
      return {
        success: true,
        data: {
          message: `MCP Query: ${prompt}`,
          note: 'AI agent will use accessibility tree for structured data extraction',
        },
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }

  /**
   * Testing and Validation Prompts
   *
   * Example AI prompts:
   * - "Test the login flow and verify success message"
   * - "Check if all images on the page have alt text"
   * - "Validate that the form submission works correctly"
   * - "Test mobile responsiveness on iPhone 15"
   */
  async queryTesting(prompt: string): Promise<PlaywrightMCPResponse> {
    try {
      return {
        success: true,
        data: {
          message: `MCP Query: ${prompt}`,
          note: 'AI agent will perform automated testing',
        },
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }

  /**
   * Screenshot and PDF Generation (requires --caps=vision,pdf)
   *
   * Example AI prompts:
   * - "Take a full-page screenshot of the homepage"
   * - "Generate a PDF of the entire documentation"
   * - "Capture a screenshot of the product gallery"
   * - "Export the report page as PDF"
   */
  async queryCapture(prompt: string): Promise<PlaywrightMCPResponse> {
    try {
      return {
        success: true,
        data: {
          message: `MCP Query: ${prompt}`,
          note: 'Requires --caps=vision or --caps=pdf enabled',
        },
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }

  /**
   * Get available MCP tools
   */
  getAvailableTools(): {
    category: string
    tools: string[]
  }[] {
    return [
      {
        category: 'Core Automation',
        tools: [
          'playwright_navigate',
          'playwright_click',
          'playwright_fill',
          'playwright_select',
          'playwright_hover',
          'playwright_press',
          'playwright_type',
          'playwright_snapshot',
        ],
      },
      {
        category: 'Tab Management',
        tools: ['playwright_open_tab', 'playwright_close_tab', 'playwright_switch_tab'],
      },
      {
        category: 'Vision (opt-in)',
        tools: ['playwright_screenshot', 'playwright_screenshot_element'],
      },
      {
        category: 'PDF (opt-in)',
        tools: ['playwright_pdf'],
      },
      {
        category: 'Verification (opt-in)',
        tools: ['playwright_expect', 'playwright_assert'],
      },
      {
        category: 'Tracing (opt-in)',
        tools: ['playwright_start_trace', 'playwright_stop_trace'],
      },
    ]
  }

  /**
   * Get example AI prompts
   */
  getExamplePrompts(): {
    category: string
    examples: string[]
  }[] {
    return [
      {
        category: 'Web Automation',
        examples: [
          'Navigate to google.com and search for "playwright automation"',
          'Go to example.com, click the "Sign In" button, and fill the login form',
          'Open amazon.com and add the first product to cart',
          'Navigate to the contact page and fill out the contact form',
          'Click through a multi-step checkout process',
        ],
      },
      {
        category: 'Web Scraping',
        examples: [
          'Extract all product names and prices from the e-commerce page',
          'Scrape article headlines and publication dates from the news site',
          'Get all email addresses and phone numbers from the contact page',
          'Extract data from a table and format as JSON',
          'Collect all image URLs from the gallery',
        ],
      },
      {
        category: 'Testing & Validation',
        examples: [
          'Test the login flow with valid credentials and verify success',
          'Validate that all links on the page are not broken',
          'Check if the mobile menu works correctly on iPhone viewport',
          'Verify form validation shows errors for invalid inputs',
          'Test that search functionality returns results',
        ],
      },
      {
        category: 'Screenshot & PDF',
        examples: [
          'Take a full-page screenshot of the homepage',
          'Capture a screenshot of the pricing table element',
          'Generate a PDF of the entire documentation site',
          'Take screenshots of the page in desktop and mobile viewports',
          'Create a PDF report of the dashboard page',
        ],
      },
      {
        category: 'Multi-Browser Testing',
        examples: [
          'Test the website in Chrome, Firefox, and WebKit',
          'Check layout differences across browsers',
          'Verify cross-browser compatibility of features',
          'Test website on different device emulations',
          'Compare rendering in headless and headed modes',
        ],
      },
      {
        category: 'SEO Analysis',
        examples: [
          'Check if all pages have proper meta tags',
          'Verify that images have alt attributes',
          'Extract all heading tags (H1, H2, H3) from the page',
          'Check if the site has a sitemap and robots.txt',
          'Analyze page load performance and Core Web Vitals',
        ],
      },
    ]
  }

  /**
   * Get configuration arguments for MCP server
   */
  getConfigArgs(): string[] {
    const args: string[] = []

    if (this.config.browser) {
      args.push('--browser', this.config.browser)
    }

    if (this.config.headless) {
      args.push('--headless')
    }

    if (this.config.viewportSize) {
      args.push('--viewport-size', this.config.viewportSize)
    }

    if (this.config.userAgent) {
      args.push('--user-agent', this.config.userAgent)
    }

    if (this.config.device) {
      args.push('--device', this.config.device)
    }

    if (this.config.timeout) {
      args.push('--timeout-action', this.config.timeout.toString())
    }

    if (this.config.isolated) {
      args.push('--isolated')
    }

    if (this.config.saveTrace) {
      args.push('--save-trace')
    }

    if (this.config.saveVideo) {
      args.push('--save-video', this.config.saveVideo)
    }

    if (this.config.capabilities && this.config.capabilities.length > 0) {
      args.push('--caps', this.config.capabilities.join(','))
    }

    return args
  }

  /**
   * Get VS Code MCP configuration
   */
  getVSCodeConfig(customArgs?: string[]): any {
    const args = customArgs || ['@playwright/mcp@latest', ...this.getConfigArgs()]

    return {
      command: 'npx',
      args,
      description: 'Playwright MCP server for browser automation and testing',
    }
  }
}

/**
 * Helper function to create Playwright MCP service instance
 */
export const createPlaywrightMCPService = (config?: PlaywrightMCPConfig): PlaywrightMCPService => {
  return new PlaywrightMCPService(config)
}

/**
 * MCP Setup Instructions
 *
 * Basic Setup (Claude Code):
 *
 * claude mcp add playwright -- npx @playwright/mcp@latest
 *
 * With Custom Configuration:
 *
 * claude mcp add playwright -- npx @playwright/mcp@latest \
 *   --browser chrome \
 *   --headless \
 *   --caps vision,pdf
 *
 * VS Code (.vscode/mcp.json):
 *
 * {
 *   "mcpServers": {
 *     "playwright": {
 *       "command": "npx",
 *       "args": ["@playwright/mcp@latest"]
 *     }
 *   }
 * }
 *
 * With Advanced Options:
 *
 * {
 *   "mcpServers": {
 *     "playwright": {
 *       "command": "npx",
 *       "args": [
 *         "@playwright/mcp@latest",
 *         "--browser", "chrome",
 *         "--headless",
 *         "--viewport-size", "1920x1080",
 *         "--caps", "vision,pdf",
 *         "--save-trace"
 *       ]
 *     }
 *   }
 * }
 *
 * Configuration Options:
 *
 * --browser <browser>          chrome, firefox, webkit, msedge
 * --headless                   Run in headless mode
 * --viewport-size <size>       e.g., "1280x720"
 * --device <device>            e.g., "iPhone 15"
 * --user-agent <ua>            Custom user agent
 * --timeout-action <ms>        Action timeout (default: 5000ms)
 * --timeout-navigation <ms>    Navigation timeout (default: 60000ms)
 * --caps <capabilities>        vision, pdf, verify, tracing
 * --isolated                   Isolated browser context
 * --save-trace                 Save Playwright trace
 * --save-video <size>          Record video (e.g., "800x600")
 * --user-data-dir <path>       Persistent profile directory
 * --storage-state <path>       Storage state for cookies/localStorage
 *
 * Available Capabilities:
 *
 * - vision: Screenshot and coordinate-based interactions
 * - pdf: PDF generation from pages
 * - verify: Assertions and expectations
 * - tracing: Playwright trace recording
 *
 * Persistent vs Isolated Sessions:
 *
 * Persistent (default):
 * - Saves browser profile to disk
 * - Keeps login sessions between runs
 * - Profile location:
 *   Windows: %USERPROFILE%\AppData\Local\ms-playwright\mcp-{channel}-profile
 *   macOS: ~/Library/Caches/ms-playwright/mcp-{channel}-profile
 *   Linux: ~/.cache/ms-playwright/mcp-{channel}-profile
 *
 * Isolated:
 * - In-memory profile
 * - Clean state for each session
 * - Use --isolated flag
 * - Optionally provide --storage-state for initial state
 *
 * Browser Extension (Chrome/Edge):
 *
 * Connect to existing browser tabs using the Playwright MCP Bridge extension.
 * See: https://github.com/microsoft/playwright-mcp/tree/main/extension
 *
 * Docker:
 *
 * docker run -it --rm \
 *   -v $(pwd):/workspace \
 *   mcr.microsoft.com/playwright:latest \
 *   npx @playwright/mcp@latest
 *
 * Supported AI Clients:
 *
 * - Claude Code ✅
 * - Claude Desktop ✅
 * - VS Code ✅
 * - Cursor ✅
 * - Windsurf ✅
 * - Goose ✅
 * - LM Studio ✅
 * - Gemini CLI ✅
 * - Codex ✅
 * - Qodo Gen ✅
 */
