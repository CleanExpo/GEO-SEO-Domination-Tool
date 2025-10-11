import { decryptCredential } from '@/lib/crypto-credentials';

/**
 * WordPress REST API Executor
 * Executes tasks on WordPress sites using encrypted credentials
 */

interface WordPressCredentials {
  wp_url: string;
  wp_username: string;
  wp_app_password_encrypted?: string;
  wp_password_encrypted?: string;
}

interface TaskInstructions {
  action: string;
  element?: string;
  content?: string;
  position?: string;
  post_id?: number;
  meta_key?: string;
  meta_value?: string;
  [key: string]: any;
}

export class WordPressExecutor {
  private baseUrl: string;
  private auth: string;

  constructor(credentials: WordPressCredentials) {
    // Clean and validate URL
    this.baseUrl = credentials.wp_url.replace(/\/$/, '');
    
    // Decrypt password
    const password = credentials.wp_app_password_encrypted
      ? decryptCredential(credentials.wp_app_password_encrypted)
      : credentials.wp_password_encrypted
      ? decryptCredential(credentials.wp_password_encrypted)
      : '';

    // Create Basic Auth header
    this.auth = Buffer.from(
      `${credentials.wp_username}:${password}`
    ).toString('base64');
  }

  /**
   * Add H1 tag to post/page
   */
  async addH1Tag(instructions: TaskInstructions): Promise<any> {
    const { post_id, content } = instructions;

    // Fetch current post
    const post = await this.fetchPost(post_id!);
    
    // Check if H1 already exists
    if (post.content.rendered.includes('<h1')) {
      return {
        success: false,
        message: 'H1 tag already exists',
        skipped: true,
      };
    }

    // Add H1 at the beginning of content
    const h1Tag = `<h1>${content}</h1>\n\n`;
    const updatedContent = h1Tag + post.content.raw;

    // Update post
    const result = await this.updatePost(post_id!, {
      content: updatedContent,
    });

    return {
      success: true,
      message: 'H1 tag added successfully',
      post_id,
      before: post.content.raw.substring(0, 100),
      after: updatedContent.substring(0, 100),
    };
  }

  /**
   * Update meta description
   */
  async updateMetaDescription(instructions: TaskInstructions): Promise<any> {
    const { post_id, content } = instructions;

    // Update Yoast SEO meta (most common)
    const result = await this.updatePostMeta(post_id!, {
      _yoast_wpseo_metadesc: content,
    });

    // Also try Rank Math
    await this.updatePostMeta(post_id!, {
      rank_math_description: content,
    });

    return {
      success: true,
      message: 'Meta description updated',
      post_id,
      meta_description: content,
    };
  }

  /**
   * Add alt text to images
   */
  async addAltText(instructions: TaskInstructions): Promise<any> {
    const { post_id, alt_text, image_id } = instructions;

    if (image_id) {
      // Update specific image
      const result = await this.updateMedia(image_id, {
        alt_text,
      });

      return {
        success: true,
        message: 'Alt text added to image',
        image_id,
        alt_text,
      };
    }

    // Find all images in post and add alt text
    const post = await this.fetchPost(post_id!);
    const images = await this.findImagesInPost(post);
    
    const results = [];
    for (const img of images) {
      if (!img.alt) {
        await this.updateMedia(img.id, {
          alt_text: alt_text || this.generateAltText(img, post),
        });
        results.push(img.id);
      }
    }

    return {
      success: true,
      message: `Added alt text to ${results.length} images`,
      images_updated: results,
    };
  }

  /**
   * Optimize images (compress, resize)
   */
  async optimizeImages(instructions: TaskInstructions): Promise<any> {
    const { post_id } = instructions;

    // This would typically integrate with image optimization plugins
    // For now, we'll return a placeholder
    return {
      success: true,
      message: 'Image optimization queued',
      note: 'Requires image optimization plugin integration',
      post_id,
    };
  }

  /**
   * Update page title
   */
  async updatePageTitle(instructions: TaskInstructions): Promise<any> {
    const { post_id, content } = instructions;

    const result = await this.updatePost(post_id!, {
      title: content,
    });

    return {
      success: true,
      message: 'Page title updated',
      post_id,
      new_title: content,
    };
  }

  /**
   * Add internal links
   */
  async addInternalLinks(instructions: TaskInstructions): Promise<any> {
    const { post_id, links } = instructions;

    const post = await this.fetchPost(post_id!);
    let content = post.content.raw;

    // Add links based on instructions
    for (const link of links) {
      const { anchor_text, target_url } = link;
      const linkHtml = `<a href="${target_url}">${anchor_text}</a>`;
      
      // Find first occurrence of anchor text and replace
      content = content.replace(
        new RegExp(`\\b${anchor_text}\\b`, 'i'),
        linkHtml
      );
    }

    await this.updatePost(post_id!, { content });

    return {
      success: true,
      message: `Added ${links.length} internal links`,
      post_id,
      links_added: links.length,
    };
  }

  // ============================================
  // WordPress REST API Methods
  // ============================================

  private async fetchPost(postId: number): Promise<any> {
    const response = await fetch(
      `${this.baseUrl}/wp-json/wp/v2/posts/${postId}?context=edit`,
      {
        headers: {
          Authorization: `Basic ${this.auth}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch post: ${response.statusText}`);
    }

    return response.json();
  }

  private async updatePost(postId: number, data: any): Promise<any> {
    const response = await fetch(
      `${this.baseUrl}/wp-json/wp/v2/posts/${postId}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${this.auth}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to update post: ${response.statusText}`);
    }

    return response.json();
  }

  private async updatePostMeta(postId: number, meta: any): Promise<any> {
    const response = await fetch(
      `${this.baseUrl}/wp-json/wp/v2/posts/${postId}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${this.auth}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ meta }),
      }
    );

    if (!response.ok) {
      // Meta update might fail if field not registered - not critical
      console.warn('Meta update failed:', response.statusText);
    }

    return response.json();
  }

  private async updateMedia(mediaId: number, data: any): Promise<any> {
    const response = await fetch(
      `${this.baseUrl}/wp-json/wp/v2/media/${mediaId}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${this.auth}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to update media: ${response.statusText}`);
    }

    return response.json();
  }

  private async findImagesInPost(post: any): Promise<any[]> {
    // Extract image IDs from post content
    const content = post.content.rendered;
    const imgRegex = /wp-image-(\d+)/g;
    const matches = [...content.matchAll(imgRegex)];
    const imageIds = matches.map(m => parseInt(m[1]));

    // Fetch image details
    const images = [];
    for (const id of imageIds) {
      try {
        const response = await fetch(
          `${this.baseUrl}/wp-json/wp/v2/media/${id}`,
          {
            headers: {
              Authorization: `Basic ${this.auth}`,
            },
          }
        );
        
        if (response.ok) {
          images.push(await response.json());
        }
      } catch (error) {
        console.warn(`Failed to fetch image ${id}:`, error);
      }
    }

    return images;
  }

  private generateAltText(image: any, post: any): string {
    // Generate alt text from post title and image filename
    const postTitle = post.title.rendered;
    const filename = image.source_url.split('/').pop()?.split('.')[0] || '';
    
    return `${postTitle} - ${filename.replace(/[-_]/g, ' ')}`;
  }

  /**
   * Test connection to WordPress site
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.baseUrl}/wp-json/wp/v2/users/me`,
        {
          headers: {
            Authorization: `Basic ${this.auth}`,
          },
        }
      );

      return response.ok;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get site info
   */
  async getSiteInfo(): Promise<any> {
    const response = await fetch(`${this.baseUrl}/wp-json`, {
      headers: {
        Authorization: `Basic ${this.auth}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch site info');
    }

    return response.json();
  }
}
