/**
 * Enhanced GitHub API Client with Rate Limiting
 *
 * Ticket: GITHUB-001
 * Author: Orchestra-Coordinator (Agent-Octo)
 * Date: 2025-10-05
 *
 * Features:
 * - Automatic retry with exponential backoff
 * - Rate limit throttling (respects GitHub's 5000 req/hr limit)
 * - Secondary rate limit handling
 * - Comprehensive error handling
 */

import { Octokit } from '@octokit/rest';
import { retry } from '@octokit/plugin-retry';
import { throttling } from '@octokit/plugin-throttling';

// Create Octokit with plugins
const OctokitWithPlugins = Octokit.plugin(retry, throttling);

export interface Repository {
  id: number;
  name: string;
  fullName: string;
  description: string;
  stars: number;
  url: string;
  language: string | null;
  private: boolean;
  updatedAt: string;
}

export interface Commit {
  sha: string;
  message: string;
  author: string;
  date: string;
  additions: number;
  deletions: number;
}

export interface PullRequest {
  number: number;
  title: string;
  body: string;
  state: 'open' | 'closed';
  url: string;
  createdAt: string;
  mergedAt: string | null;
}

/**
 * Enhanced GitHub Connector with Rate Limiting
 */
export class GitHubConnectorV2 {
  private octokit: Octokit;
  private rateLimitWarningThreshold = 100; // Warn when remaining < 100 requests

  constructor(config: { accessToken: string }) {
    this.octokit = new OctokitWithPlugins({
      auth: config.accessToken,
      throttle: {
        onRateLimit: (retryAfter, options, octokit, retryCount) => {
          console.warn(
            `[GitHub] Rate limit hit for ${options.method} ${options.url}. ` +
            `Retrying after ${retryAfter}s (attempt ${retryCount}/3)`
          );

          // Retry up to 3 times
          if (retryCount < 3) {
            return true;
          }

          console.error(`[GitHub] Rate limit exceeded after 3 retries`);
          return false;
        },
        onSecondaryRateLimit: (retryAfter, options, octokit) => {
          console.warn(
            `[GitHub] Secondary rate limit hit for ${options.method} ${options.url}. ` +
            `Waiting ${retryAfter}s before retry`
          );
          // Always retry on secondary rate limits
          return true;
        }
      },
      retry: {
        doNotRetry: [400, 401, 403, 404, 422], // Don't retry client errors
        retries: 3,
      },
      log: {
        debug: () => {},
        info: console.info,
        warn: console.warn,
        error: console.error,
      },
    });
  }

  /**
   * Check current rate limit status
   */
  async getRateLimitStatus(): Promise<{
    limit: number;
    remaining: number;
    reset: Date;
    percentRemaining: number;
  }> {
    const { data } = await this.octokit.rateLimit.get();

    const core = data.resources.core;
    const percentRemaining = (core.remaining / core.limit) * 100;

    // Warn if below threshold
    if (core.remaining < this.rateLimitWarningThreshold) {
      console.warn(
        `[GitHub] Rate limit warning: ${core.remaining}/${core.limit} requests remaining ` +
        `(${percentRemaining.toFixed(1)}%). Resets at ${new Date(core.reset * 1000)}`
      );
    }

    return {
      limit: core.limit,
      remaining: core.remaining,
      reset: new Date(core.reset * 1000),
      percentRemaining,
    };
  }

  /**
   * List repositories for authenticated user
   */
  async listRepositories(options?: { limit?: number }): Promise<Repository[]> {
    const { data } = await this.octokit.repos.listForAuthenticatedUser({
      per_page: Math.min(options?.limit || 30, 100), // GitHub max 100/page
      sort: 'updated',
    });

    return data.map(repo => ({
      id: repo.id,
      name: repo.name,
      fullName: repo.full_name,
      description: repo.description || '',
      stars: repo.stargazers_count,
      url: repo.html_url,
      language: repo.language,
      private: repo.private,
      updatedAt: repo.updated_at,
    }));
  }

  /**
   * Get repository details
   */
  async getRepository(owner: string, repo: string): Promise<Repository> {
    const { data } = await this.octokit.repos.get({
      owner,
      repo,
    });

    return {
      id: data.id,
      name: data.name,
      fullName: data.full_name,
      description: data.description || '',
      stars: data.stargazers_count,
      url: data.html_url,
      language: data.language,
      private: data.private,
      updatedAt: data.updated_at,
    };
  }

  /**
   * Get recent commits
   */
  async getCommits(
    owner: string,
    repo: string,
    options?: { limit?: number; since?: string }
  ): Promise<Commit[]> {
    const { data } = await this.octokit.repos.listCommits({
      owner,
      repo,
      per_page: Math.min(options?.limit || 20, 100),
      since: options?.since,
    });

    return data.map(commit => ({
      sha: commit.sha,
      message: commit.commit.message,
      author: commit.commit.author?.name || 'Unknown',
      date: commit.commit.author?.date || '',
      additions: 0, // Not available in list endpoint
      deletions: 0,
    }));
  }

  /**
   * Get pull requests
   */
  async getPullRequests(
    owner: string,
    repo: string,
    options?: { state?: 'open' | 'closed' | 'all'; limit?: number }
  ): Promise<PullRequest[]> {
    const { data } = await this.octokit.pulls.list({
      owner,
      repo,
      state: options?.state || 'open',
      per_page: Math.min(options?.limit || 20, 100),
    });

    return data.map(pr => ({
      number: pr.number,
      title: pr.title,
      body: pr.body || '',
      state: pr.state as 'open' | 'closed',
      url: pr.html_url,
      createdAt: pr.created_at,
      mergedAt: pr.merged_at,
    }));
  }

  /**
   * Create a webhook
   */
  async createWebhook(
    owner: string,
    repo: string,
    config: {
      url: string;
      secret: string;
      events?: string[];
    }
  ): Promise<{ id: number; url: string }> {
    const { data } = await this.octokit.repos.createWebhook({
      owner,
      repo,
      name: 'web',
      active: true,
      events: config.events || ['push', 'pull_request', 'issues', 'release'],
      config: {
        url: config.url,
        content_type: 'json',
        secret: config.secret,
        insecure_ssl: '0',
      },
    });

    return {
      id: data.id,
      url: data.url,
    };
  }

  /**
   * Verify webhook signature (for use in webhook handlers)
   */
  static verifyWebhookSignature(signature: string, body: string, secret: string): boolean {
    const crypto = require('crypto');

    if (!signature) return false;

    const hmac = crypto.createHmac('sha256', secret);
    const digest = `sha256=${hmac.update(body).digest('hex')}`;

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(digest)
    );
  }
}

/**
 * Create a singleton GitHub connector instance
 */
let connectorInstance: GitHubConnectorV2 | null = null;

export function getGitHubConnector(token?: string): GitHubConnectorV2 {
  const accessToken = token || process.env.GITHUB_TOKEN || '';

  if (!accessToken) {
    throw new Error('GitHub access token is required');
  }

  if (!connectorInstance || token) {
    connectorInstance = new GitHubConnectorV2({ accessToken });
  }

  return connectorInstance;
}
