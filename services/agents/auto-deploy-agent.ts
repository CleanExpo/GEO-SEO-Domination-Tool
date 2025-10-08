/**
 * Auto-Deploy Agent
 *
 * Autonomous content publishing to multiple platforms
 * - WordPress blog posts
 * - LinkedIn company pages
 * - Facebook business pages
 * - Twitter/X posts
 * - Google My Business posts
 *
 * Completes the automation loop: Generate → Deploy → Dominate
 */

import { ContentPackage } from './content-generation-agent';

export interface DeploymentRequest {
  contentId?: string;
  content?: ContentPackage; // Can provide content directly

  // Target platforms
  platforms: {
    nodejs?: NodeJSConfig; // Your custom Node.js site
    wordpress?: WordPressConfig;
    linkedin?: LinkedInConfig;
    facebook?: FacebookConfig;
    twitter?: TwitterConfig;
    gmb?: GMBConfig;
  };

  // Publishing options
  publishNow?: boolean; // If false, saves as draft
  scheduleFor?: string; // ISO timestamp for scheduled publishing

  // Tracking
  portfolioId?: string;
}

export interface NodeJSConfig {
  apiUrl: string; // Your Node.js site API endpoint
  apiKey?: string; // Optional API key for authentication
  category?: string;
  tags?: string[];
  status?: 'published' | 'draft';
}

export interface WordPressConfig {
  siteUrl: string;
  username: string;
  applicationPassword: string; // WordPress Application Password
  categories?: string[]; // Category slugs or IDs
  tags?: string[];
  status?: 'publish' | 'draft' | 'pending';
  featuredImageUrl?: string;
}

export interface LinkedInConfig {
  accessToken: string;
  organizationId: string; // LinkedIn organization URN
  visibility?: 'PUBLIC' | 'CONNECTIONS';
}

export interface FacebookConfig {
  accessToken: string;
  pageId: string;
  published?: boolean; // If false, saves as draft
}

export interface TwitterConfig {
  apiKey: string;
  apiSecret: string;
  accessToken: string;
  accessSecret: string;
}

export interface GMBConfig {
  accessToken: string;
  locationId: string; // Google My Business location ID
  callToAction?: {
    actionType: 'LEARN_MORE' | 'SIGN_UP' | 'CALL' | 'BOOK';
    url?: string;
  };
}

export interface DeploymentResult {
  success: boolean;
  platform: string;
  postId?: string;
  postUrl?: string;
  error?: string;
  publishedAt?: string;
}

export interface DeploymentReport {
  contentId?: string;
  contentTitle: string;
  totalPlatforms: number;
  successfulDeployments: number;
  failedDeployments: number;
  results: DeploymentResult[];
  deployedAt: string;
  cost: number; // API costs if any
}

export class AutoDeployAgent {
  /**
   * Deploy content to multiple platforms
   */
  async deployContent(request: DeploymentRequest): Promise<DeploymentReport> {
    console.log('\n🚀 Auto-Deploy Agent: Starting deployment...');
    console.log(`   Content: ${request.content?.title || request.contentId}`);
    console.log(`   Platforms: ${Object.keys(request.platforms).join(', ')}`);

    const results: DeploymentResult[] = [];
    let cost = 0;

    // Deploy to each platform in parallel
    const deploymentPromises: Promise<DeploymentResult>[] = [];

    if (request.platforms.nodejs) {
      deploymentPromises.push(
        this.deployToNodeJS(request.content!, request.platforms.nodejs)
      );
    }

    if (request.platforms.wordpress) {
      deploymentPromises.push(
        this.deployToWordPress(request.content!, request.platforms.wordpress)
      );
    }

    if (request.platforms.linkedin) {
      deploymentPromises.push(
        this.deployToLinkedIn(request.content!, request.platforms.linkedin)
      );
    }

    if (request.platforms.facebook) {
      deploymentPromises.push(
        this.deployToFacebook(request.content!, request.platforms.facebook)
      );
    }

    if (request.platforms.twitter) {
      deploymentPromises.push(
        this.deployToTwitter(request.content!, request.platforms.twitter)
      );
    }

    if (request.platforms.gmb) {
      deploymentPromises.push(
        this.deployToGMB(request.content!, request.platforms.gmb)
      );
    }

    const deploymentResults = await Promise.allSettled(deploymentPromises);

    // Process results
    deploymentResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        results.push(result.value);
        cost += result.value.platform === 'twitter' ? 0 : 0; // Most platforms are free
      } else {
        const platforms = Object.keys(request.platforms);
        results.push({
          success: false,
          platform: platforms[index],
          error: result.reason?.message || 'Unknown error'
        });
      }
    });

    const successfulDeployments = results.filter(r => r.success).length;
    const failedDeployments = results.filter(r => !r.success).length;

    console.log(`\n✅ Deployment Complete!`);
    console.log(`   Successful: ${successfulDeployments}/${results.length}`);
    console.log(`   Failed: ${failedDeployments}/${results.length}`);

    return {
      contentId: request.contentId,
      contentTitle: request.content?.title || 'Unknown',
      totalPlatforms: results.length,
      successfulDeployments,
      failedDeployments,
      results,
      deployedAt: new Date().toISOString(),
      cost
    };
  }

  /**
   * Deploy to custom Node.js site
   */
  private async deployToNodeJS(
    content: ContentPackage,
    config: NodeJSConfig
  ): Promise<DeploymentResult> {
    console.log('  🚀 Deploying to Node.js site...');

    try {
      // Prepare post data
      const postData = {
        title: content.title,
        content: content.content,
        contentHTML: content.contentHTML,
        summary: content.summary,
        category: config.category,
        tags: config.tags || content.tags || [],
        status: config.status || 'published',
        featuredImage: content.featuredImage,
        images: content.images,
        infographics: content.infographics,
        diagrams: content.diagrams,
        meta: content.meta,
        keywords: content.keywords,
        citations: content.citations
      };

      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };

      if (config.apiKey) {
        headers['Authorization'] = `Bearer ${config.apiKey}`;
      }

      const response = await fetch(config.apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(postData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Node.js API error: ${response.status} ${errorText}`);
      }

      const result = await response.json();

      console.log(`  ✅ Node.js site: Published post ${result.id || 'success'}`);

      return {
        success: true,
        platform: 'nodejs',
        postId: result.id?.toString(),
        postUrl: result.url || `${config.apiUrl}/${result.slug || result.id}`,
        publishedAt: result.publishedAt || new Date().toISOString()
      };

    } catch (error: any) {
      console.error(`  ❌ Node.js deployment failed:`, error.message);
      return {
        success: false,
        platform: 'nodejs',
        error: error.message
      };
    }
  }

  /**
   * Deploy to WordPress
   */
  private async deployToWordPress(
    content: ContentPackage,
    config: WordPressConfig
  ): Promise<DeploymentResult> {
    console.log('  📝 Deploying to WordPress...');

    try {
      const auth = Buffer.from(`${config.username}:${config.applicationPassword}`).toString('base64');

      // Prepare post data
      const postData = {
        title: content.title,
        content: content.contentHTML || this.convertMarkdownToHTML(content.content),
        excerpt: content.summary,
        status: config.status || 'publish',
        categories: config.categories || [],
        tags: config.tags || content.tags || [],
        meta: {
          _yoast_wpseo_title: content.meta.title,
          _yoast_wpseo_metadesc: content.meta.description,
        }
      };

      // If featured image URL provided, upload it first
      if (content.featuredImage?.url || config.featuredImageUrl) {
        const imageUrl = content.featuredImage?.url || config.featuredImageUrl!;

        // Upload media to WordPress
        const mediaResponse = await fetch(`${config.siteUrl}/wp-json/wp/v2/media`, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Disposition': `attachment; filename="${content.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.png"`
          },
          body: await this.fetchImageAsBuffer(imageUrl)
        });

        if (mediaResponse.ok) {
          const mediaData = await mediaResponse.json();
          (postData as any).featured_media = mediaData.id;
        }
      }

      // Create post
      const response = await fetch(`${config.siteUrl}/wp-json/wp/v2/posts`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(postData)
      });

      if (!response.ok) {
        throw new Error(`WordPress API error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();

      console.log(`  ✅ WordPress: Published post ID ${result.id}`);

      return {
        success: true,
        platform: 'wordpress',
        postId: result.id.toString(),
        postUrl: result.link,
        publishedAt: result.date
      };

    } catch (error: any) {
      console.error(`  ❌ WordPress deployment failed:`, error.message);
      return {
        success: false,
        platform: 'wordpress',
        error: error.message
      };
    }
  }

  /**
   * Deploy to LinkedIn
   */
  private async deployToLinkedIn(
    content: ContentPackage,
    config: LinkedInConfig
  ): Promise<DeploymentResult> {
    console.log('  💼 Deploying to LinkedIn...');

    try {
      // LinkedIn requires posts to be under 3000 characters
      const postText = content.type === 'social_post'
        ? content.content
        : `${content.title}\n\n${content.summary}\n\n${content.meta.description}`;

      const truncatedText = postText.length > 3000
        ? postText.substring(0, 2997) + '...'
        : postText;

      // Prepare post data
      const postData = {
        author: config.organizationId,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: {
              text: truncatedText
            },
            shareMediaCategory: content.featuredImage ? 'IMAGE' : 'NONE',
            ...(content.featuredImage && {
              media: [{
                status: 'READY',
                description: {
                  text: content.featuredImage.alt || content.title
                },
                media: content.featuredImage.url,
                title: {
                  text: content.title
                }
              }]
            })
          }
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': config.visibility || 'PUBLIC'
        }
      };

      const response = await fetch('https://api.linkedin.com/v2/ugcPosts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.accessToken}`,
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0'
        },
        body: JSON.stringify(postData)
      });

      if (!response.ok) {
        throw new Error(`LinkedIn API error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();

      console.log(`  ✅ LinkedIn: Published post ${result.id}`);

      return {
        success: true,
        platform: 'linkedin',
        postId: result.id,
        postUrl: `https://www.linkedin.com/feed/update/${result.id}`,
        publishedAt: new Date().toISOString()
      };

    } catch (error: any) {
      console.error(`  ❌ LinkedIn deployment failed:`, error.message);
      return {
        success: false,
        platform: 'linkedin',
        error: error.message
      };
    }
  }

  /**
   * Deploy to Facebook
   */
  private async deployToFacebook(
    content: ContentPackage,
    config: FacebookConfig
  ): Promise<DeploymentResult> {
    console.log('  👥 Deploying to Facebook...');

    try {
      // Facebook Graph API
      const postText = content.type === 'social_post'
        ? content.content
        : `${content.title}\n\n${content.summary}`;

      const params = new URLSearchParams({
        message: postText,
        access_token: config.accessToken,
        published: (config.published !== false).toString()
      });

      // If there's a featured image, post as photo
      if (content.featuredImage?.url) {
        params.append('url', content.featuredImage.url);
        params.append('caption', content.title);
      }

      const endpoint = content.featuredImage
        ? `https://graph.facebook.com/v18.0/${config.pageId}/photos`
        : `https://graph.facebook.com/v18.0/${config.pageId}/feed`;

      const response = await fetch(endpoint, {
        method: 'POST',
        body: params
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Facebook API error: ${error.error?.message || response.statusText}`);
      }

      const result = await response.json();

      console.log(`  ✅ Facebook: Published post ${result.id}`);

      return {
        success: true,
        platform: 'facebook',
        postId: result.id,
        postUrl: `https://www.facebook.com/${result.id}`,
        publishedAt: new Date().toISOString()
      };

    } catch (error: any) {
      console.error(`  ❌ Facebook deployment failed:`, error.message);
      return {
        success: false,
        platform: 'facebook',
        error: error.message
      };
    }
  }

  /**
   * Deploy to Twitter/X
   */
  private async deployToTwitter(
    content: ContentPackage,
    config: TwitterConfig
  ): Promise<DeploymentResult> {
    console.log('  🐦 Deploying to Twitter...');

    try {
      // Twitter has 280 character limit
      const tweetText = content.type === 'social_post'
        ? content.content.substring(0, 280)
        : `${content.title}\n\n${content.summary.substring(0, 200)}...`;

      // Note: Twitter API v2 requires OAuth 2.0
      // This is a simplified example - in production use a proper OAuth library

      const response = await fetch('https://api.twitter.com/2/tweets', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: tweetText
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Twitter API error: ${error.detail || response.statusText}`);
      }

      const result = await response.json();

      console.log(`  ✅ Twitter: Published tweet ${result.data.id}`);

      return {
        success: true,
        platform: 'twitter',
        postId: result.data.id,
        postUrl: `https://twitter.com/i/web/status/${result.data.id}`,
        publishedAt: new Date().toISOString()
      };

    } catch (error: any) {
      console.error(`  ❌ Twitter deployment failed:`, error.message);
      return {
        success: false,
        platform: 'twitter',
        error: error.message
      };
    }
  }

  /**
   * Deploy to Google My Business
   */
  private async deployToGMB(
    content: ContentPackage,
    config: GMBConfig
  ): Promise<DeploymentResult> {
    console.log('  📍 Deploying to Google My Business...');

    try {
      // GMB posts have 1500 character limit
      const postText = content.type === 'social_post'
        ? content.content
        : content.summary;

      const truncatedText = postText.length > 1500
        ? postText.substring(0, 1497) + '...'
        : postText;

      const postData: any = {
        languageCode: 'en-US',
        summary: truncatedText,
        topicType: 'STANDARD'
      };

      // Add media if available
      if (content.featuredImage?.url) {
        postData.media = [{
          mediaFormat: 'PHOTO',
          sourceUrl: content.featuredImage.url
        }];
      }

      // Add call to action if specified
      if (config.callToAction) {
        postData.callToAction = {
          actionType: config.callToAction.actionType,
          url: config.callToAction.url
        };
      }

      const response = await fetch(
        `https://mybusiness.googleapis.com/v4/${config.locationId}/localPosts`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${config.accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(postData)
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`GMB API error: ${error.error?.message || response.statusText}`);
      }

      const result = await response.json();

      console.log(`  ✅ GMB: Published post ${result.name}`);

      return {
        success: true,
        platform: 'gmb',
        postId: result.name,
        postUrl: `https://business.google.com/posts/${config.locationId}`,
        publishedAt: result.createTime
      };

    } catch (error: any) {
      console.error(`  ❌ GMB deployment failed:`, error.message);
      return {
        success: false,
        platform: 'gmb',
        error: error.message
      };
    }
  }

  /**
   * Helper: Convert markdown to HTML
   */
  private convertMarkdownToHTML(markdown: string): string {
    return markdown
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/^(.+)$/gim, '<p>$1</p>')
      .replace(/<\/p><p><h/g, '</p><h')
      .replace(/<\/h([1-6])><\/p>/g, '</h$1>');
  }

  /**
   * Helper: Fetch image as buffer
   */
  private async fetchImageAsBuffer(url: string): Promise<Buffer> {
    // If it's a local file path, read from filesystem
    if (url.startsWith('/generated/') || url.startsWith('public/generated/')) {
      const fs = await import('fs/promises');
      const path = await import('path');
      const filePath = url.startsWith('/')
        ? path.join(process.cwd(), 'public', url)
        : path.join(process.cwd(), url);
      return fs.readFile(filePath);
    }

    // Otherwise fetch from URL
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }
}

// Export singleton instance
export const autoDeployAgent = new AutoDeployAgent();
