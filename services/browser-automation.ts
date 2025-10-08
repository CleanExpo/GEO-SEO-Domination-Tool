/**
 * Browser Automation Service
 * Provides browser control capabilities for autonomous agents using Playwright
 */

import { chromium, Browser, Page, BrowserContext } from 'playwright';

export interface BrowserAction {
  type: 'navigate' | 'click' | 'fill' | 'scroll' | 'screenshot' | 'extract' | 'execute';
  selector?: string;
  value?: string;
  url?: string;
  script?: string;
  waitFor?: number;
}

export interface BrowserSession {
  browser: Browser;
  context: BrowserContext;
  page: Page;
  sessionId: string;
  startTime: number;
}

export interface BrowserActionResult {
  success: boolean;
  data?: any;
  screenshot?: string; // Base64 encoded
  error?: string;
  timestamp: number;
}

class BrowserAutomationService {
  private sessions: Map<string, BrowserSession> = new Map();

  /**
   * Create a new browser session
   */
  async createSession(options: {
    headless?: boolean;
    viewport?: { width: number; height: number };
    userAgent?: string;
  } = {}): Promise<string> {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const browser = await chromium.launch({
      headless: options.headless !== false, // Default to headless
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const context = await browser.newContext({
      viewport: options.viewport || { width: 1920, height: 1080 },
      userAgent: options.userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    });

    const page = await context.newPage();

    this.sessions.set(sessionId, {
      browser,
      context,
      page,
      sessionId,
      startTime: Date.now()
    });

    console.log(`[BrowserAutomation] Created session: ${sessionId}`);
    return sessionId;
  }

  /**
   * Execute a browser action
   */
  async executeAction(
    sessionId: string,
    action: BrowserAction
  ): Promise<BrowserActionResult> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return {
        success: false,
        error: `Session ${sessionId} not found`,
        timestamp: Date.now()
      };
    }

    const { page } = session;

    try {
      let data: any = null;
      let screenshot: string | undefined;

      switch (action.type) {
        case 'navigate':
          if (!action.url) throw new Error('URL required for navigate action');
          await page.goto(action.url, { waitUntil: 'domcontentloaded' });
          data = { url: page.url(), title: await page.title() };
          break;

        case 'click':
          if (!action.selector) throw new Error('Selector required for click action');
          await page.click(action.selector);
          if (action.waitFor) await page.waitForTimeout(action.waitFor);
          break;

        case 'fill':
          if (!action.selector || !action.value) {
            throw new Error('Selector and value required for fill action');
          }
          await page.fill(action.selector, action.value);
          break;

        case 'scroll':
          const scrollAmount = parseInt(action.value || '500', 10);
          await page.evaluate((amount) => {
            window.scrollBy(0, amount);
          }, scrollAmount);
          break;

        case 'screenshot':
          const screenshotBuffer = await page.screenshot({ fullPage: false });
          screenshot = screenshotBuffer.toString('base64');
          break;

        case 'extract':
          if (!action.selector) throw new Error('Selector required for extract action');
          data = await page.$$eval(action.selector, (elements) =>
            elements.map((el) => ({
              text: el.textContent?.trim(),
              html: el.innerHTML,
              attributes: Array.from(el.attributes).reduce((acc: any, attr) => {
                acc[attr.name] = attr.value;
                return acc;
              }, {})
            }))
          );
          break;

        case 'execute':
          if (!action.script) throw new Error('Script required for execute action');
          data = await page.evaluate(action.script);
          break;

        default:
          throw new Error(`Unknown action type: ${(action as any).type}`);
      }

      console.log(`[BrowserAutomation] Executed ${action.type} in session ${sessionId}`);

      return {
        success: true,
        data,
        screenshot,
        timestamp: Date.now()
      };
    } catch (error: any) {
      console.error(`[BrowserAutomation] Error in session ${sessionId}:`, error.message);
      return {
        success: false,
        error: error.message,
        timestamp: Date.now()
      };
    }
  }

  /**
   * Execute a sequence of actions
   */
  async executeSequence(
    sessionId: string,
    actions: BrowserAction[]
  ): Promise<BrowserActionResult[]> {
    const results: BrowserActionResult[] = [];

    for (const action of actions) {
      const result = await this.executeAction(sessionId, action);
      results.push(result);

      // Stop on first failure
      if (!result.success) {
        break;
      }
    }

    return results;
  }

  /**
   * Get page content (HTML, text, or accessibility tree)
   */
  async getPageContent(sessionId: string, format: 'html' | 'text' | 'accessibility' = 'text'): Promise<string> {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error(`Session ${sessionId} not found`);

    const { page } = session;

    switch (format) {
      case 'html':
        return await page.content();

      case 'text':
        return await page.innerText('body');

      case 'accessibility':
        const snapshot = await page.accessibility.snapshot();
        return JSON.stringify(snapshot, null, 2);

      default:
        throw new Error(`Unknown format: ${format}`);
    }
  }

  /**
   * Close a browser session
   */
  async closeSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      console.warn(`[BrowserAutomation] Session ${sessionId} not found`);
      return;
    }

    await session.browser.close();
    this.sessions.delete(sessionId);
    console.log(`[BrowserAutomation] Closed session: ${sessionId}`);
  }

  /**
   * Get active sessions
   */
  getActiveSessions(): string[] {
    return Array.from(this.sessions.keys());
  }

  /**
   * Close all sessions
   */
  async closeAllSessions(): Promise<void> {
    const sessionIds = this.getActiveSessions();
    await Promise.all(sessionIds.map((id) => this.closeSession(id)));
    console.log(`[BrowserAutomation] Closed all ${sessionIds.length} sessions`);
  }
}

// Export singleton instance
export const browserAutomation = new BrowserAutomationService();

// Export helper functions
export async function createBrowserSession(headless = true) {
  return await browserAutomation.createSession({ headless });
}

export async function navigateToUrl(sessionId: string, url: string) {
  return await browserAutomation.executeAction(sessionId, {
    type: 'navigate',
    url
  });
}

export async function clickElement(sessionId: string, selector: string) {
  return await browserAutomation.executeAction(sessionId, {
    type: 'click',
    selector
  });
}

export async function fillForm(sessionId: string, selector: string, value: string) {
  return await browserAutomation.executeAction(sessionId, {
    type: 'fill',
    selector,
    value
  });
}

export async function takeScreenshot(sessionId: string) {
  return await browserAutomation.executeAction(sessionId, {
    type: 'screenshot'
  });
}

export async function extractData(sessionId: string, selector: string) {
  return await browserAutomation.executeAction(sessionId, {
    type: 'extract',
    selector
  });
}

export async function scrollPage(sessionId: string, amount = 500) {
  return await browserAutomation.executeAction(sessionId, {
    type: 'scroll',
    value: amount.toString()
  });
}
