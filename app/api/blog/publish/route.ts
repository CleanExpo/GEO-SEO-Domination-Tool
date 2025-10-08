/**
 * Blog Publishing API (Example for your Node.js site)
 *
 * This endpoint receives content from the Auto-Deploy Agent
 * and publishes it to your Node.js blog/site
 *
 * POST /api/blog/publish
 */

import { NextRequest, NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'data', 'geo-seo.db');

/**
 * Publish blog post to your Node.js site
 *
 * POST /api/blog/publish
 *
 * Body:
 * {
 *   title: string,
 *   content: string,
 *   contentHTML: string,
 *   summary: string,
 *   category: string,
 *   tags: string[],
 *   status: 'published' | 'draft',
 *   featuredImage: { url, alt, caption },
 *   images: [...],
 *   infographics: [...],
 *   diagrams: [...],
 *   meta: { title, description, keywords, ogImage },
 *   keywords: string[],
 *   citations: string[]
 * }
 *
 * Headers:
 * Authorization: Bearer <your-api-key>  (optional - for security)
 */
export async function POST(request: NextRequest) {
  const db = new Database(dbPath);

  try {
    // Optional: Check API key for security
    const authHeader = request.headers.get('authorization');
    const expectedApiKey = process.env.BLOG_API_KEY;

    if (expectedApiKey && authHeader !== `Bearer ${expectedApiKey}`) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();

    const {
      title,
      content,
      contentHTML,
      summary,
      category = 'general',
      tags = [],
      status = 'published',
      featuredImage,
      images = [],
      infographics = [],
      diagrams = [],
      meta,
      keywords = [],
      citations = []
    } = body;

    // Validation
    if (!title || !content) {
      return NextResponse.json(
        { success: false, error: 'title and content are required' },
        { status: 400 }
      );
    }

    console.log(`\n📝 Publishing blog post: "${title}"`);

    // Create slug from title
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    // Insert blog post into database
    // Note: You'll need to create a blog_posts table or use your existing table structure
    const insertStmt = db.prepare(`
      INSERT INTO blog_posts (
        slug,
        title,
        content,
        content_html,
        summary,
        category,
        tags,
        status,
        featured_image,
        visual_assets,
        meta_title,
        meta_description,
        keywords,
        citations,
        published_at,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
        CASE WHEN ? = 'published' THEN datetime('now') ELSE NULL END,
        datetime('now')
      )
    `);

    let result;
    try {
      result = insertStmt.run(
        slug,
        title,
        content,
        contentHTML || null,
        summary,
        category,
        JSON.stringify(tags),
        status,
        featuredImage ? JSON.stringify(featuredImage) : null,
        JSON.stringify({ images, infographics, diagrams }),
        meta?.title || title,
        meta?.description || summary,
        JSON.stringify(keywords),
        JSON.stringify(citations),
        status
      );
    } catch (error: any) {
      // If table doesn't exist, create it
      if (error.message.includes('no such table')) {
        console.log('  Creating blog_posts table...');

        db.exec(`
          CREATE TABLE IF NOT EXISTS blog_posts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            slug TEXT UNIQUE NOT NULL,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            content_html TEXT,
            summary TEXT,
            category TEXT DEFAULT 'general',
            tags TEXT DEFAULT '[]',
            status TEXT DEFAULT 'draft',
            featured_image TEXT,
            visual_assets TEXT DEFAULT '{}',
            meta_title TEXT,
            meta_description TEXT,
            keywords TEXT DEFAULT '[]',
            citations TEXT DEFAULT '[]',
            view_count INTEGER DEFAULT 0,
            published_at TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT
          );

          CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
          CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON blog_posts(status);
          CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at ON blog_posts(published_at);
        `);

        // Try insert again
        result = insertStmt.run(
          slug,
          title,
          content,
          contentHTML || null,
          summary,
          category,
          JSON.stringify(tags),
          status,
          featuredImage ? JSON.stringify(featuredImage) : null,
          JSON.stringify({ images, infographics, diagrams }),
          meta?.title || title,
          meta?.description || summary,
          JSON.stringify(keywords),
          JSON.stringify(citations),
          status
        );
      } else {
        throw error;
      }
    }

    const postId = result.lastInsertRowid.toString();
    const postUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/blog/${slug}`;

    console.log(`  ✅ Published: ${postUrl}`);

    return NextResponse.json({
      success: true,
      id: postId,
      slug,
      url: postUrl,
      publishedAt: status === 'published' ? new Date().toISOString() : null,
      message: `Blog post ${status === 'published' ? 'published' : 'saved as draft'} successfully`
    });

  } catch (error: any) {
    console.error('❌ Blog publish error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to publish blog post',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );

  } finally {
    db.close();
  }
}

/**
 * Get published blog posts
 *
 * GET /api/blog/publish?status=published&limit=10
 */
export async function GET(request: NextRequest) {
  const db = new Database(dbPath);

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'published';
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Check if table exists
    const tableExists = db.prepare(`
      SELECT name FROM sqlite_master WHERE type='table' AND name='blog_posts'
    `).get();

    if (!tableExists) {
      return NextResponse.json({
        success: true,
        total: 0,
        posts: []
      });
    }

    const posts = db.prepare(`
      SELECT * FROM blog_posts
      WHERE status = ?
      ORDER BY published_at DESC, created_at DESC
      LIMIT ? OFFSET ?
    `).all(status, limit, offset) as any[];

    return NextResponse.json({
      success: true,
      total: posts.length,
      posts: posts.map(post => ({
        id: post.id,
        slug: post.slug,
        title: post.title,
        summary: post.summary,
        category: post.category,
        tags: JSON.parse(post.tags),
        status: post.status,
        featuredImage: post.featured_image ? JSON.parse(post.featured_image) : null,
        meta: {
          title: post.meta_title,
          description: post.meta_description
        },
        viewCount: post.view_count,
        publishedAt: post.published_at,
        createdAt: post.created_at
      }))
    });

  } catch (error: any) {
    console.error('❌ Blog retrieve error:', error);

    return NextResponse.json(
      { success: false, error: error.message || 'Failed to retrieve blog posts' },
      { status: 500 }
    );

  } finally {
    db.close();
  }
}
