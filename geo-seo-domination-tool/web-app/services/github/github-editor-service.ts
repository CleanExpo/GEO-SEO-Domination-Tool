/**
 * GitHub Editor Service
 *
 * Edit Next.js/Node.js sites via GitHub repository
 * Changes trigger auto-deployment via Vercel/Netlify
 */

import { Octokit } from '@octokit/rest';

interface GitHubConnection {
  id: string;
  user_id: string;
  company_id: string;
  repo_owner: string;
  repo_name: string;
  branch: string;
  access_token: string;
  deployment_platform: 'vercel' | 'netlify';
  site_url: string;
}

interface FileEdit {
  path: string;
  content: string;
  message: string;
}

interface SEOMetadataEdit {
  page_path: string; // e.g., 'app/page.tsx' or 'pages/index.tsx'
  title?: string;
  description?: string;
  keywords?: string[];
}

class GitHubEditorService {
  /**
   * Create Octokit client with user's GitHub token
   */
  private createClient(accessToken: string): Octokit {
    return new Octokit({
      auth: accessToken,
    });
  }

  /**
   * Test connection to GitHub repository
   */
  async testConnection(connection: GitHubConnection): Promise<boolean> {
    try {
      const octokit = this.createClient(connection.access_token);

      const { data } = await octokit.repos.get({
        owner: connection.repo_owner,
        repo: connection.repo_name,
      });

      return data !== null;
    } catch (error) {
      console.error('GitHub connection test failed:', error);
      return false;
    }
  }

  /**
   * Get repository information
   */
  async getRepoInfo(connection: GitHubConnection) {
    const octokit = this.createClient(connection.access_token);

    const { data: repo } = await octokit.repos.get({
      owner: connection.repo_owner,
      repo: connection.repo_name,
    });

    const { data: branches } = await octokit.repos.listBranches({
      owner: connection.repo_owner,
      repo: connection.repo_name,
    });

    return {
      name: repo.name,
      full_name: repo.full_name,
      description: repo.description,
      default_branch: repo.default_branch,
      branches: branches.map(b => b.name),
      updated_at: repo.updated_at,
      html_url: repo.html_url,
    };
  }

  /**
   * Get file content from repository
   */
  async getFileContent(
    connection: GitHubConnection,
    filePath: string
  ): Promise<{ content: string; sha: string }> {
    const octokit = this.createClient(connection.access_token);

    try {
      const { data } = await octokit.repos.getContent({
        owner: connection.repo_owner,
        repo: connection.repo_name,
        path: filePath,
        ref: connection.branch,
      });

      if (Array.isArray(data) || data.type !== 'file') {
        throw new Error('Path is not a file');
      }

      // Decode base64 content
      const content = Buffer.from(data.content, 'base64').toString('utf-8');

      return {
        content,
        sha: data.sha,
      };
    } catch (error: any) {
      if (error.status === 404) {
        // File doesn't exist yet
        return { content: '', sha: '' };
      }
      throw error;
    }
  }

  /**
   * Update or create file in repository
   */
  async updateFile(
    connection: GitHubConnection,
    filePath: string,
    content: string,
    commitMessage: string
  ): Promise<{ commit_sha: string; file_sha: string }> {
    const octokit = this.createClient(connection.access_token);

    // Get current file SHA if exists
    let currentSha = '';
    try {
      const existing = await this.getFileContent(connection, filePath);
      currentSha = existing.sha;
    } catch (error) {
      // File doesn't exist, that's okay
    }

    // Update or create file
    const { data } = await octokit.repos.createOrUpdateFileContents({
      owner: connection.repo_owner,
      repo: connection.repo_name,
      path: filePath,
      message: commitMessage,
      content: Buffer.from(content).toString('base64'),
      branch: connection.branch,
      sha: currentSha || undefined,
    });

    return {
      commit_sha: data.commit.sha,
      file_sha: data.content?.sha || '',
    };
  }

  /**
   * Update multiple files in a single commit
   */
  async updateMultipleFiles(
    connection: GitHubConnection,
    edits: FileEdit[],
    commitMessage: string
  ): Promise<{ commit_sha: string }> {
    const octokit = this.createClient(connection.access_token);

    // Get current branch reference
    const { data: ref } = await octokit.git.getRef({
      owner: connection.repo_owner,
      repo: connection.repo_name,
      ref: `heads/${connection.branch}`,
    });

    const currentCommitSha = ref.object.sha;

    // Get current tree
    const { data: commit } = await octokit.git.getCommit({
      owner: connection.repo_owner,
      repo: connection.repo_name,
      commit_sha: currentCommitSha,
    });

    const currentTreeSha = commit.tree.sha;

    // Create blobs for each file
    const blobs = await Promise.all(
      edits.map(async (edit) => {
        const { data: blob } = await octokit.git.createBlob({
          owner: connection.repo_owner,
          repo: connection.repo_name,
          content: Buffer.from(edit.content).toString('base64'),
          encoding: 'base64',
        });

        return {
          path: edit.path,
          mode: '100644' as const,
          type: 'blob' as const,
          sha: blob.sha,
        };
      })
    );

    // Create new tree
    const { data: newTree } = await octokit.git.createTree({
      owner: connection.repo_owner,
      repo: connection.repo_name,
      base_tree: currentTreeSha,
      tree: blobs,
    });

    // Create new commit
    const { data: newCommit } = await octokit.git.createCommit({
      owner: connection.repo_owner,
      repo: connection.repo_name,
      message: commitMessage,
      tree: newTree.sha,
      parents: [currentCommitSha],
    });

    // Update branch reference
    await octokit.git.updateRef({
      owner: connection.repo_owner,
      repo: connection.repo_name,
      ref: `heads/${connection.branch}`,
      sha: newCommit.sha,
    });

    return {
      commit_sha: newCommit.sha,
    };
  }

  /**
   * Update SEO metadata in Next.js page (App Router)
   */
  async updateNextJsMetadata(
    connection: GitHubConnection,
    edit: SEOMetadataEdit
  ): Promise<{ success: boolean; commit_sha: string }> {
    // Get current page content
    const { content, sha } = await this.getFileContent(connection, edit.page_path);

    // Parse and update metadata export
    let updatedContent = content;

    // Update title
    if (edit.title) {
      // Match: export const metadata = { title: '...' }
      updatedContent = updatedContent.replace(
        /(export\s+const\s+metadata\s*=\s*\{[\s\S]*?title:\s*['"])([^'"]+)(['"'])/,
        `$1${edit.title}$3`
      );

      // If metadata export doesn't exist, add it
      if (!updatedContent.includes('export const metadata')) {
        const metadataExport = `\nexport const metadata = {\n  title: '${edit.title}',\n  description: '${edit.description || ''}',\n};\n\n`;
        updatedContent = metadataExport + updatedContent;
      }
    }

    // Update description
    if (edit.description) {
      updatedContent = updatedContent.replace(
        /(export\s+const\s+metadata\s*=\s*\{[\s\S]*?description:\s*['"])([^'"]+)(['"'])/,
        `$1${edit.description}$3`
      );

      // Add description if metadata exists but description doesn't
      if (updatedContent.includes('export const metadata') && !updatedContent.includes('description:')) {
        updatedContent = updatedContent.replace(
          /(export\s+const\s+metadata\s*=\s*\{)/,
          `$1\n  description: '${edit.description}',`
        );
      }
    }

    // Commit changes
    const { commit_sha } = await this.updateFile(
      connection,
      edit.page_path,
      updatedContent,
      `SEO: Update metadata for ${edit.page_path}\n\n- Title: ${edit.title || '(unchanged)'}\n- Description: ${edit.description || '(unchanged)'}\n\n🤖 Auto-generated by GEO-SEO Domination Tool`
    );

    return {
      success: true,
      commit_sha,
    };
  }

  /**
   * Add or update image alt text in Next.js Image components
   */
  async updateImageAlt(
    connection: GitHubConnection,
    pagePath: string,
    imageSrc: string,
    newAltText: string
  ): Promise<{ success: boolean; commit_sha: string }> {
    const { content } = await this.getFileContent(connection, pagePath);

    // Find and update Image component with matching src
    const imagePattern = new RegExp(
      `(<Image[^>]*src=["']${imageSrc.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["'][^>]*alt=["'])([^"']*)`,
      'g'
    );

    const updatedContent = content.replace(imagePattern, `$1${newAltText}`);

    if (content === updatedContent) {
      throw new Error('Image not found or already has alt text');
    }

    const { commit_sha } = await this.updateFile(
      connection,
      pagePath,
      updatedContent,
      `SEO: Update image alt text\n\n- Image: ${imageSrc}\n- Alt: ${newAltText}\n\n🤖 Auto-generated by GEO-SEO Domination Tool`
    );

    return {
      success: true,
      commit_sha,
    };
  }

  /**
   * Rollback changes by reverting to previous commit
   */
  async rollbackCommit(
    connection: GitHubConnection,
    commitSha: string
  ): Promise<{ success: boolean; revert_commit_sha: string }> {
    const octokit = this.createClient(connection.access_token);

    // Get the commit to revert
    const { data: commitToRevert } = await octokit.git.getCommit({
      owner: connection.repo_owner,
      repo: connection.repo_name,
      commit_sha: commitSha,
    });

    // Get current branch HEAD
    const { data: ref } = await octokit.git.getRef({
      owner: connection.repo_owner,
      repo: connection.repo_name,
      ref: `heads/${connection.branch}`,
    });

    // Get parent commit (the one before the change)
    const parentSha = commitToRevert.parents[0].sha;

    // Get parent commit tree
    const { data: parentCommit } = await octokit.git.getCommit({
      owner: connection.repo_owner,
      repo: connection.repo_name,
      commit_sha: parentSha,
    });

    // Create revert commit
    const { data: revertCommit } = await octokit.git.createCommit({
      owner: connection.repo_owner,
      repo: connection.repo_name,
      message: `Revert: ${commitToRevert.message}\n\nThis reverts commit ${commitSha}\n\n🤖 Rollback by GEO-SEO Domination Tool`,
      tree: parentCommit.tree.sha,
      parents: [ref.object.sha],
    });

    // Update branch to point to revert commit
    await octokit.git.updateRef({
      owner: connection.repo_owner,
      repo: connection.repo_name,
      ref: `heads/${connection.branch}`,
      sha: revertCommit.sha,
    });

    return {
      success: true,
      revert_commit_sha: revertCommit.sha,
    };
  }

  /**
   * Get all Next.js pages in the repository
   */
  async getNextJsPages(connection: GitHubConnection): Promise<string[]> {
    const octokit = this.createClient(connection.access_token);

    const pages: string[] = [];

    // Try App Router (app/ directory)
    try {
      const { data: appDir } = await octokit.repos.getContent({
        owner: connection.repo_owner,
        repo: connection.repo_name,
        path: 'app',
        ref: connection.branch,
      });

      if (Array.isArray(appDir)) {
        for (const item of appDir) {
          if (item.type === 'file' && item.name === 'page.tsx') {
            pages.push(item.path);
          } else if (item.type === 'dir') {
            // Recursively get pages from subdirectories
            const subPages = await this.getFilesRecursive(
              connection,
              item.path,
              'page.tsx'
            );
            pages.push(...subPages);
          }
        }
      }
    } catch (error) {
      console.log('No app/ directory found (App Router)');
    }

    // Try Pages Router (pages/ directory)
    try {
      const { data: pagesDir } = await octokit.repos.getContent({
        owner: connection.repo_owner,
        repo: connection.repo_name,
        path: 'pages',
        ref: connection.branch,
      });

      if (Array.isArray(pagesDir)) {
        for (const item of pagesDir) {
          if (
            item.type === 'file' &&
            (item.name.endsWith('.tsx') || item.name.endsWith('.jsx'))
          ) {
            pages.push(item.path);
          }
        }
      }
    } catch (error) {
      console.log('No pages/ directory found (Pages Router)');
    }

    return pages;
  }

  /**
   * Recursively get files matching a pattern
   */
  private async getFilesRecursive(
    connection: GitHubConnection,
    dirPath: string,
    filePattern: string
  ): Promise<string[]> {
    const octokit = this.createClient(connection.access_token);
    const files: string[] = [];

    try {
      const { data: contents } = await octokit.repos.getContent({
        owner: connection.repo_owner,
        repo: connection.repo_name,
        path: dirPath,
        ref: connection.branch,
      });

      if (Array.isArray(contents)) {
        for (const item of contents) {
          if (item.type === 'file' && item.name === filePattern) {
            files.push(item.path);
          } else if (item.type === 'dir') {
            const subFiles = await this.getFilesRecursive(
              connection,
              item.path,
              filePattern
            );
            files.push(...subFiles);
          }
        }
      }
    } catch (error) {
      console.error(`Error reading directory ${dirPath}:`, error);
    }

    return files;
  }

  /**
   * Create a new branch for SEO changes (safer than editing main directly)
   */
  async createSeoBranch(
    connection: GitHubConnection,
    branchName: string
  ): Promise<{ branch_name: string; branch_sha: string }> {
    const octokit = this.createClient(connection.access_token);

    // Get current branch HEAD
    const { data: ref } = await octokit.git.getRef({
      owner: connection.repo_owner,
      repo: connection.repo_name,
      ref: `heads/${connection.branch}`,
    });

    // Create new branch from current HEAD
    await octokit.git.createRef({
      owner: connection.repo_owner,
      repo: connection.repo_name,
      ref: `refs/heads/${branchName}`,
      sha: ref.object.sha,
    });

    return {
      branch_name: branchName,
      branch_sha: ref.object.sha,
    };
  }

  /**
   * Create a pull request for SEO changes
   */
  async createPullRequest(
    connection: GitHubConnection,
    headBranch: string,
    title: string,
    body: string
  ): Promise<{ pr_number: number; pr_url: string }> {
    const octokit = this.createClient(connection.access_token);

    const { data: pr } = await octokit.pulls.create({
      owner: connection.repo_owner,
      repo: connection.repo_name,
      title,
      body,
      head: headBranch,
      base: connection.branch,
    });

    return {
      pr_number: pr.number,
      pr_url: pr.html_url,
    };
  }

  /**
   * Get commit history for a file (for audit trail)
   */
  async getFileHistory(
    connection: GitHubConnection,
    filePath: string,
    limit = 10
  ): Promise<Array<{
    sha: string;
    message: string;
    author: string;
    date: string;
  }>> {
    const octokit = this.createClient(connection.access_token);

    const { data: commits } = await octokit.repos.listCommits({
      owner: connection.repo_owner,
      repo: connection.repo_name,
      path: filePath,
      per_page: limit,
    });

    return commits.map(commit => ({
      sha: commit.sha,
      message: commit.commit.message,
      author: commit.commit.author?.name || 'Unknown',
      date: commit.commit.author?.date || '',
    }));
  }
}

export const githubEditorService = new GitHubEditorService();
