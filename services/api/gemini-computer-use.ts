/**
 * Gemini 2.5 Computer Use Service
 *
 * CRITICAL SECURITY: NO PAYMENTS ALLOWED
 * This service includes multiple safety layers to prevent any payment-related actions.
 *
 * Environment Variables:
 * - GEMINI_KEY (primary - set in Vercel)
 * - GEMINI_API_KEY (fallback)
 * - GOOGLE_API_KEY (fallback)
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { chromium, Browser, Page } from 'playwright';

// ============================================================================
// API KEY RESOLUTION
// ============================================================================

/**
 * Get Gemini API key from environment variables
 * Priority: GEMINI_KEY > GEMINI_API_KEY > GOOGLE_API_KEY
 */
export function getGeminiApiKey(): string {
  const key =
    process.env.GEMINI_KEY ||
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY;

  if (!key) {
    throw new Error(
      'Gemini API key not found. Please set GEMINI_KEY, GEMINI_API_KEY, or GOOGLE_API_KEY environment variable.'
    );
  }

  return key;
}

// ============================================================================
// SECURITY CONFIGURATION - NO PAYMENTS ALLOWED
// ============================================================================

/**
 * PAYMENT PREVENTION - Level 1: Blocked Domains
 * Any domain containing these patterns will be BLOCKED immediately
 */
const PAYMENT_BLOCKED_DOMAINS = [
  'paypal.com',
  'stripe.com',
  'square.com',
  'venmo.com',
  'cashapp.com',
  'payment',
  'checkout',
  'billing',
  'purchase',
  'buy.', // buy.example.com
  'shop.',
  'cart.',
  'order.',
  'pay.',
];

/**
 * PAYMENT PREVENTION - Level 2: Blocked URL Patterns
 * URLs containing these patterns will be BLOCKED
 */
const PAYMENT_BLOCKED_URL_PATTERNS = [
  '/checkout',
  '/payment',
  '/billing',
  '/cart',
  '/purchase',
  '/buy',
  '/order',
  '/pay',
  '/subscribe',
  '/donation',
  '/contribute',
];

/**
 * PAYMENT PREVENTION - Level 3: Blocked Keywords in UI
 * If these keywords are detected in screenshots/text, actions will be BLOCKED
 * NOTE: Only checks for actual payment forms, not general price mentions
 */
const PAYMENT_BLOCKED_KEYWORDS = [
  'credit card number',
  'debit card number',
  'card number:',
  'enter card number',
  'cvv:',
  'cvv code',
  'security code',
  'expiry date:',
  'expiration date:',
  'billing address',
  'payment method:',
  'select payment method',
  'proceed to checkout',
  'place your order',
  'complete your purchase',
  'enter payment details',
  'payment information',
  'checkout securely',
];

/**
 * PAYMENT PREVENTION - Level 4: Blocked UI Actions
 * These predefined functions are PERMANENTLY DISABLED for payment safety
 */
const PAYMENT_BLOCKED_ACTIONS = [
  'drag_and_drop', // Prevent dragging payment info
  // Additional actions can be blocked here
];

/**
 * PAYMENT PREVENTION - Level 5: Sensitive Form Fields
 * Form inputs with these names/IDs will trigger BLOCKING
 */
const PAYMENT_BLOCKED_FORM_FIELDS = [
  'cardnumber',
  'card_number',
  'cc_number',
  'creditcard',
  'credit_card',
  'cvv',
  'cvc',
  'expiry',
  'exp_date',
  'billing',
  'payment',
];

// ============================================================================
// INTERFACES
// ============================================================================

export interface ComputerUseConfig {
  apiKey: string;
  headless?: boolean;
  timeout?: number;
  allowPayments?: false; // HARDCODED TO FALSE - CANNOT BE OVERRIDDEN
}

export interface AutomationTask {
  description: string;
  startUrl?: string;
  maxSteps?: number;
  requireConfirmation?: boolean;
}

export interface AutomationResult {
  success: boolean;
  steps: AutomationStep[];
  error?: string;
  blockedReason?: string;
}

export interface AutomationStep {
  stepNumber: number;
  action: string;
  timestamp: Date;
  screenshot?: string;
  blocked?: boolean;
  blockReason?: string;
}

// ============================================================================
// GEMINI COMPUTER USE SERVICE
// ============================================================================

export class GeminiComputerUseService {
  private genAI: GoogleGenerativeAI;
  private browser?: Browser;
  private page?: Page;
  private config: ComputerUseConfig;
  private conversationHistory: any[] = [];

  // SECURITY: Payment prevention is ALWAYS enabled
  private readonly PAYMENTS_BLOCKED = true;

  constructor(config: ComputerUseConfig) {
    // SECURITY CHECK: Force allowPayments to false
    if (config.allowPayments !== false) {
      console.warn('⚠️  SECURITY: Attempted to enable payments - BLOCKED. Payments are permanently disabled.');
      config.allowPayments = false;
    }

    this.config = {
      ...config,
      allowPayments: false, // HARDCODED
      headless: config.headless ?? true,
      timeout: config.timeout ?? 30000,
    };

    this.genAI = new GoogleGenerativeAI(config.apiKey);
  }

  /**
   * SECURITY: Check if URL is payment-related
   */
  private isPaymentUrl(url: string): { blocked: boolean; reason?: string } {
    const lowerUrl = url.toLowerCase();

    // Check blocked domains
    for (const domain of PAYMENT_BLOCKED_DOMAINS) {
      if (lowerUrl.includes(domain)) {
        return {
          blocked: true,
          reason: `PAYMENT BLOCKED: URL contains payment-related domain: ${domain}`,
        };
      }
    }

    // Check blocked URL patterns
    for (const pattern of PAYMENT_BLOCKED_URL_PATTERNS) {
      if (lowerUrl.includes(pattern)) {
        return {
          blocked: true,
          reason: `PAYMENT BLOCKED: URL contains payment-related pattern: ${pattern}`,
        };
      }
    }

    return { blocked: false };
  }

  /**
   * SECURITY: Check if page content contains payment keywords
   */
  private async isPaymentPage(): Promise<{ blocked: boolean; reason?: string }> {
    if (!this.page) return { blocked: false };

    try {
      const pageText = await this.page.textContent('body');
      if (!pageText) return { blocked: false };

      const lowerText = pageText.toLowerCase();

      // Check for payment keywords
      for (const keyword of PAYMENT_BLOCKED_KEYWORDS) {
        if (lowerText.includes(keyword.toLowerCase())) {
          return {
            blocked: true,
            reason: `PAYMENT BLOCKED: Page contains payment keyword: "${keyword}"`,
          };
        }
      }

      // Check for payment form fields
      const formFields = await this.page.$$eval('input', (inputs) =>
        inputs.map((input) => ({
          name: input.getAttribute('name') || '',
          id: input.getAttribute('id') || '',
          type: input.getAttribute('type') || '',
        }))
      );

      for (const field of formFields) {
        const fieldName = (field.name + field.id).toLowerCase();
        for (const blockedField of PAYMENT_BLOCKED_FORM_FIELDS) {
          if (fieldName.includes(blockedField)) {
            return {
              blocked: true,
              reason: `PAYMENT BLOCKED: Page contains payment form field: "${blockedField}"`,
            };
          }
        }
      }
    } catch (error) {
      console.warn('Warning: Could not check page content for payments:', error);
    }

    return { blocked: false };
  }

  /**
   * Initialize browser instance
   */
  async initialize(): Promise<void> {
    console.log('🚀 Initializing Gemini Computer Use Service...');
    console.log('🔒 SECURITY: Payment blocking is ENABLED');

    this.browser = await chromium.launch({
      headless: this.config.headless,
    });

    this.page = await this.browser.newPage();

    // Set viewport size
    await this.page.setViewportSize({ width: 1280, height: 720 });

    console.log('✅ Browser initialized');
  }

  /**
   * Execute automated task with PAYMENT BLOCKING
   */
  async executeTask(task: AutomationTask): Promise<AutomationResult> {
    if (!this.page) {
      throw new Error('Browser not initialized. Call initialize() first.');
    }

    console.log('\n📋 Starting task:', task.description);
    console.log('🔒 SECURITY: Payment blocking ACTIVE\n');

    const steps: AutomationStep[] = [];
    const maxSteps = task.maxSteps ?? 20;

    try {
      // Navigate to start URL if provided
      if (task.startUrl) {
        // SECURITY CHECK: Verify URL is not payment-related
        const urlCheck = this.isPaymentUrl(task.startUrl);
        if (urlCheck.blocked) {
          console.error('🚨', urlCheck.reason);
          return {
            success: false,
            steps,
            error: 'Task blocked: Start URL is payment-related',
            blockedReason: urlCheck.reason,
          };
        }

        console.log('🌐 Navigating to:', task.startUrl);
        await this.page.goto(task.startUrl, { waitUntil: 'domcontentloaded' });

        // SECURITY CHECK: Verify page is not payment-related
        const pageCheck = await this.isPaymentPage();
        if (pageCheck.blocked) {
          console.error('🚨', pageCheck.reason);
          return {
            success: false,
            steps,
            error: 'Task blocked: Page contains payment content',
            blockedReason: pageCheck.reason,
          };
        }
      }

      // Agent loop
      for (let stepNum = 1; stepNum <= maxSteps; stepNum++) {
        console.log(`\n--- Step ${stepNum}/${maxSteps} ---`);

        // STEP 1: Capture screenshot
        const screenshot = await this.page.screenshot({ type: 'png' });
        const screenshotBase64 = screenshot.toString('base64');

        // SECURITY CHECK: Re-verify page after each step
        const currentUrl = this.page.url();
        const urlCheck = this.isPaymentUrl(currentUrl);
        if (urlCheck.blocked) {
          const step: AutomationStep = {
            stepNumber: stepNum,
            action: 'BLOCKED',
            timestamp: new Date(),
            blocked: true,
            blockReason: urlCheck.reason,
          };
          steps.push(step);
          console.error('🚨', urlCheck.reason);
          return {
            success: false,
            steps,
            error: 'Task blocked during execution',
            blockedReason: urlCheck.reason,
          };
        }

        const pageCheck = await this.isPaymentPage();
        if (pageCheck.blocked) {
          const step: AutomationStep = {
            stepNumber: stepNum,
            action: 'BLOCKED',
            timestamp: new Date(),
            blocked: true,
            blockReason: pageCheck.reason,
          };
          steps.push(step);
          console.error('🚨', pageCheck.reason);
          return {
            success: false,
            steps,
            error: 'Task blocked during execution',
            blockedReason: pageCheck.reason,
          };
        }

        // STEP 2: Send to Gemini with screenshot
        const model = this.genAI.getGenerativeModel({
          model: 'gemini-2.5-computer-use-preview-10-2025',
        });

        const result = await model.generateContent({
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: `Task: ${task.description}\n\nCurrent URL: ${currentUrl}\n\nIMPORTANT SAFETY RULES:\n- NEVER interact with payment pages\n- NEVER enter credit card information\n- NEVER click "Buy", "Purchase", "Checkout" buttons\n- STOP immediately if you detect payment-related content\n\nWhat should I do next?`,
                },
                {
                  inlineData: {
                    mimeType: 'image/png',
                    data: screenshotBase64,
                  },
                },
              ],
            },
          ],
          tools: [
            {
              computerUse: {
                environment: 'ENVIRONMENT_BROWSER',
                excludedPredefinedFunctions: PAYMENT_BLOCKED_ACTIONS,
              },
            },
          ],
        });

        const response = result.response;
        const functionCalls = response.functionCalls();

        // STEP 3: Execute function calls
        if (functionCalls && functionCalls.length > 0) {
          for (const call of functionCalls) {
            const action = call.name;
            const args = call.args;

            console.log(`🔧 Action: ${action}`, args);

            // SECURITY CHECK: Block payment-related actions
            if (PAYMENT_BLOCKED_ACTIONS.includes(action)) {
              const step: AutomationStep = {
                stepNumber: stepNum,
                action,
                timestamp: new Date(),
                blocked: true,
                blockReason: `PAYMENT BLOCKED: Action "${action}" is permanently disabled`,
              };
              steps.push(step);
              console.error('🚨 BLOCKED:', step.blockReason);
              continue;
            }

            // Execute UI action
            try {
              await this.executeAction(action, args);

              const step: AutomationStep = {
                stepNumber: stepNum,
                action: `${action}(${JSON.stringify(args)})`,
                timestamp: new Date(),
                screenshot: screenshotBase64,
              };
              steps.push(step);
            } catch (error) {
              console.error('Error executing action:', error);
              const step: AutomationStep = {
                stepNumber: stepNum,
                action: `${action} (FAILED)`,
                timestamp: new Date(),
              };
              steps.push(step);
            }

            // Small delay between actions
            await this.page.waitForTimeout(1000);
          }
        } else {
          // No more actions - task complete
          console.log('✅ Task completed - no more actions needed');
          return {
            success: true,
            steps,
          };
        }

        // Check if user confirmation required
        if (task.requireConfirmation && stepNum < maxSteps) {
          console.log('\n⏸️  Paused for user confirmation. Continue? (In real implementation, wait for user input)');
          // In production, implement actual confirmation mechanism
        }
      }

      return {
        success: true,
        steps,
      };
    } catch (error: any) {
      console.error('❌ Task failed:', error);
      return {
        success: false,
        steps,
        error: error.message,
      };
    }
  }

  /**
   * Execute individual UI action
   */
  private async executeAction(action: string, args: any): Promise<void> {
    if (!this.page) throw new Error('Page not initialized');

    switch (action) {
      case 'open_web_browser':
        // SECURITY CHECK: Block payment URLs
        const urlCheck = this.isPaymentUrl(args.url);
        if (urlCheck.blocked) {
          console.error('🚨', urlCheck.reason);
          throw new Error(urlCheck.reason);
        }
        await this.page.goto(args.url, { waitUntil: 'domcontentloaded' });
        break;

      case 'click_at':
        await this.page.mouse.click(args.x, args.y);
        break;

      case 'type_text_at':
        // SECURITY: Check if typing payment-related info
        const textLower = args.text.toLowerCase();
        for (const keyword of PAYMENT_BLOCKED_KEYWORDS) {
          if (textLower.includes(keyword.toLowerCase())) {
            console.error('🚨 PAYMENT BLOCKED: Attempted to type payment keyword:', keyword);
            throw new Error('Blocked: Attempted to type payment-related information');
          }
        }
        await this.page.mouse.click(args.x, args.y);
        await this.page.keyboard.type(args.text);
        break;

      case 'scroll_document':
        const direction = args.direction.toLowerCase();
        const amount = args.amount || 300;
        if (direction === 'down') {
          await this.page.mouse.wheel(0, amount);
        } else if (direction === 'up') {
          await this.page.mouse.wheel(0, -amount);
        }
        break;

      case 'navigate':
        const navAction = args.action.toLowerCase();
        if (navAction === 'back') {
          await this.page.goBack();
        } else if (navAction === 'forward') {
          await this.page.goForward();
        } else if (navAction === 'refresh') {
          await this.page.reload();
        }
        break;

      case 'key_combination':
        const keys = args.keys || [];
        for (const key of keys) {
          await this.page.keyboard.down(key);
        }
        for (const key of keys.reverse()) {
          await this.page.keyboard.up(key);
        }
        break;

      case 'hover_at':
        await this.page.mouse.move(args.x, args.y);
        break;

      default:
        console.warn('Unknown action:', action);
    }
  }

  /**
   * Clean up resources
   */
  async cleanup(): Promise<void> {
    console.log('\n🧹 Cleaning up...');
    if (this.browser) {
      await this.browser.close();
    }
    console.log('✅ Cleanup complete');
  }
}

// ============================================================================
// EXPORT DEFAULT FACTORY
// ============================================================================

export default function createGeminiComputerUseService(
  apiKey: string,
  options?: Partial<ComputerUseConfig>
): GeminiComputerUseService {
  return new GeminiComputerUseService({
    apiKey,
    ...options,
    allowPayments: false, // HARDCODED - CANNOT BE OVERRIDDEN
  });
}
