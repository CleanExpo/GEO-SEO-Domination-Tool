/**
 * Browser Agent
 * Specialist agent for web automation, data extraction, and browser-based tasks
 */

import { AgentConfig } from './types';
import { browserAutomation, BrowserAction } from '../browser-automation';

export const browserAgent: AgentConfig = {
  id: 'browser-agent',
  name: 'Browser Agent',
  role: 'browser_automation_specialist',
  description: 'Automates web browser interactions, navigates websites, extracts data, and performs web-based tasks',
  capabilities: [
    {
      name: 'navigate_web',
      description: 'Navigate to URLs and interact with web pages',
      requiredTools: ['playwright', 'chromium']
    },
    {
      name: 'extract_data',
      description: 'Extract structured data from websites',
      requiredTools: ['playwright', 'accessibility_tree']
    },
    {
      name: 'automate_workflows',
      description: 'Automate multi-step web workflows',
      requiredTools: ['playwright', 'screenshots']
    },
    {
      name: 'monitor_changes',
      description: 'Monitor websites for changes',
      requiredTools: ['playwright', 'diff_detection']
    }
  ],
  model: 'claude-3-5-sonnet-20241022',
  temperature: 0.1, // Low temperature for deterministic automation
  maxTokens: 4000
};

/**
 * Browser Agent Execution Functions
 */

export interface BrowserAgentTask {
  goal: string;
  url?: string;
  actions?: BrowserAction[];
  extractSelectors?: string[];
  headless?: boolean;
}

export interface BrowserAgentResult {
  success: boolean;
  sessionId?: string;
  screenshots?: string[];
  extractedData?: any[];
  finalUrl?: string;
  error?: string;
  actionLog?: string[];
}

/**
 * Execute browser automation task
 */
export async function executeBrowserTask(task: BrowserAgentTask): Promise<BrowserAgentResult> {
  const actionLog: string[] = [];
  const screenshots: string[] = [];
  let sessionId: string | undefined;

  try {
    // Create browser session
    sessionId = await browserAutomation.createSession({
      headless: task.headless !== false
    });

    actionLog.push(`Created browser session: ${sessionId}`);

    // Navigate to URL if provided
    if (task.url) {
      const navResult = await browserAutomation.executeAction(sessionId, {
        type: 'navigate',
        url: task.url
      });

      if (!navResult.success) {
        throw new Error(`Failed to navigate to ${task.url}: ${navResult.error}`);
      }

      actionLog.push(`Navigated to: ${task.url}`);

      // Take screenshot after navigation
      const screenshotResult = await browserAutomation.executeAction(sessionId, {
        type: 'screenshot'
      });

      if (screenshotResult.success && screenshotResult.screenshot) {
        screenshots.push(screenshotResult.screenshot);
      }
    }

    // Execute custom actions if provided
    if (task.actions && task.actions.length > 0) {
      const results = await browserAutomation.executeSequence(sessionId, task.actions);

      results.forEach((result, index) => {
        if (result.success) {
          actionLog.push(`Action ${index + 1} (${task.actions![index].type}) completed`);
          if (result.screenshot) {
            screenshots.push(result.screenshot);
          }
        } else {
          actionLog.push(`Action ${index + 1} (${task.actions![index].type}) failed: ${result.error}`);
        }
      });
    }

    // Extract data if selectors provided
    let extractedData: any[] = [];
    if (task.extractSelectors && task.extractSelectors.length > 0) {
      for (const selector of task.extractSelectors) {
        const extractResult = await browserAutomation.executeAction(sessionId, {
          type: 'extract',
          selector
        });

        if (extractResult.success && extractResult.data) {
          extractedData.push({
            selector,
            data: extractResult.data
          });
          actionLog.push(`Extracted data from: ${selector} (${extractResult.data.length} elements)`);
        }
      }
    }

    // Get final URL
    const content = await browserAutomation.getPageContent(sessionId, 'html');
    const finalUrl = task.url; // Would need to extract from page in real implementation

    return {
      success: true,
      sessionId,
      screenshots,
      extractedData,
      finalUrl,
      actionLog
    };
  } catch (error: any) {
    actionLog.push(`ERROR: ${error.message}`);

    return {
      success: false,
      sessionId,
      screenshots,
      error: error.message,
      actionLog
    };
  } finally {
    // Close session
    if (sessionId) {
      await browserAutomation.closeSession(sessionId);
      actionLog.push(`Closed browser session`);
    }
  }
}

/**
 * Common browser automation workflows
 */

export async function searchGoogle(query: string): Promise<BrowserAgentResult> {
  return await executeBrowserTask({
    goal: `Search Google for: ${query}`,
    url: `https://www.google.com/search?q=${encodeURIComponent(query)}`,
    extractSelectors: [
      'h3',                    // Result titles
      '.g a[href]',           // Result links
      '.VwiC3b'               // Snippets
    ],
    headless: true
  });
}

export async function scrapeWebsite(url: string, selectors: string[]): Promise<BrowserAgentResult> {
  return await executeBrowserTask({
    goal: `Scrape data from: ${url}`,
    url,
    extractSelectors: selectors,
    headless: true
  });
}

export async function monitorPage(url: string, checkInterval = 60000): Promise<BrowserAgentResult> {
  // This would implement periodic checking with diff detection
  return await executeBrowserTask({
    goal: `Monitor page for changes: ${url}`,
    url,
    extractSelectors: ['body'],
    headless: true
  });
}

export async function fillAndSubmitForm(
  url: string,
  formData: Array<{ selector: string; value: string }>,
  submitSelector: string
): Promise<BrowserAgentResult> {
  const actions: BrowserAction[] = [
    { type: 'navigate', url },
    ...formData.map((field) => ({
      type: 'fill' as const,
      selector: field.selector,
      value: field.value
    })),
    { type: 'click', selector: submitSelector },
    { type: 'screenshot' }
  ];

  return await executeBrowserTask({
    goal: `Fill and submit form on: ${url}`,
    actions,
    headless: false // Show browser for form submission
  });
}
