#!/usr/bin/env node

/**
 * Seed script to populate sample tutorials in the database
 * Run with: node scripts/seed-tutorials.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../web-app/.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials. Check your .env.local file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const sampleTutorials = [
  {
    title: 'SEO Fundamentals for Beginners',
    description: 'Learn the basics of Search Engine Optimization and how to improve your website\'s visibility in search results.',
    content: `<h2>Introduction to SEO</h2>
<p>Search Engine Optimization (SEO) is the practice of optimizing your website to rank higher in search engine results pages (SERPs).</p>

<h3>Key Concepts</h3>
<ul>
  <li><strong>Keywords:</strong> Understanding search intent and targeting the right keywords</li>
  <li><strong>On-Page SEO:</strong> Optimizing title tags, meta descriptions, headers, and content</li>
  <li><strong>Technical SEO:</strong> Site speed, mobile-friendliness, and crawlability</li>
  <li><strong>Off-Page SEO:</strong> Building quality backlinks and brand mentions</li>
</ul>

<h3>Getting Started</h3>
<p>1. Conduct keyword research using tools like Google Keyword Planner or SEMrush</p>
<p>2. Optimize your page titles and meta descriptions</p>
<p>3. Create high-quality, relevant content</p>
<p>4. Build internal links between related pages</p>
<p>5. Monitor your rankings and traffic</p>

<h3>Common Mistakes to Avoid</h3>
<ul>
  <li>Keyword stuffing</li>
  <li>Duplicate content</li>
  <li>Ignoring mobile optimization</li>
  <li>Slow page load times</li>
</ul>`,
    category: 'SEO',
    difficulty: 'beginner',
    duration: 30,
    tags: JSON.stringify(['seo', 'basics', 'keywords', 'optimization']),
    resources: JSON.stringify([
      'Google Search Central Documentation',
      'Moz Beginner\'s Guide to SEO',
      'SEMrush Academy SEO Fundamentals Course'
    ]),
    favorite: false,
    views: 0
  },
  {
    title: 'Local SEO Strategy: Dominate Your Geographic Market',
    description: 'Master local SEO tactics to rank #1 in your city and drive more foot traffic to your business.',
    content: `<h2>Local SEO Mastery</h2>
<p>Local SEO focuses on optimizing your online presence to attract more business from relevant local searches.</p>

<h3>Google My Business Optimization</h3>
<ul>
  <li>Claim and verify your GMB listing</li>
  <li>Complete all business information accurately</li>
  <li>Add high-quality photos and videos</li>
  <li>Collect and respond to customer reviews</li>
  <li>Post regular updates and offers</li>
</ul>

<h3>NAP Consistency</h3>
<p>Ensure your Name, Address, and Phone number are consistent across all online directories:</p>
<ul>
  <li>Your website</li>
  <li>Google My Business</li>
  <li>Yelp, Yellow Pages, and other directories</li>
  <li>Social media profiles</li>
</ul>

<h3>Local Citation Building</h3>
<p>Build citations on high-authority local directories:</p>
<ol>
  <li>Identify top directories in your industry</li>
  <li>Create consistent business listings</li>
  <li>Include photos and detailed descriptions</li>
  <li>Monitor and update regularly</li>
</ol>

<h3>Local Content Strategy</h3>
<ul>
  <li>Create location-specific landing pages</li>
  <li>Write blog posts about local events and news</li>
  <li>Feature local customer testimonials</li>
  <li>Optimize for "near me" searches</li>
</ul>`,
    category: 'Local SEO',
    difficulty: 'intermediate',
    duration: 45,
    tags: JSON.stringify(['local-seo', 'google-my-business', 'citations', 'local-ranking']),
    resources: JSON.stringify([
      'BrightLocal Local SEO Guide',
      'Google My Business Best Practices',
      'Whitespark Citation Building Guide'
    ]),
    favorite: true,
    views: 0
  },
  {
    title: 'Advanced Technical SEO: Core Web Vitals & Page Speed',
    description: 'Dive deep into technical SEO optimization, focusing on Core Web Vitals and site performance.',
    content: `<h2>Technical SEO Optimization</h2>
<p>Technical SEO ensures search engines can crawl, index, and understand your website efficiently.</p>

<h3>Understanding Core Web Vitals</h3>
<p>Google's Core Web Vitals measure user experience:</p>
<ul>
  <li><strong>LCP (Largest Contentful Paint):</strong> Loading performance - should occur within 2.5 seconds</li>
  <li><strong>FID (First Input Delay):</strong> Interactivity - should be less than 100 milliseconds</li>
  <li><strong>CLS (Cumulative Layout Shift):</strong> Visual stability - should be less than 0.1</li>
</ul>

<h3>Page Speed Optimization</h3>
<ol>
  <li><strong>Optimize Images:</strong>
    <ul>
      <li>Use WebP or AVIF formats</li>
      <li>Implement lazy loading</li>
      <li>Compress images without quality loss</li>
      <li>Use responsive images with srcset</li>
    </ul>
  </li>
  <li><strong>Minimize JavaScript:</strong>
    <ul>
      <li>Remove unused JavaScript</li>
      <li>Code splitting and lazy loading</li>
      <li>Defer non-critical JavaScript</li>
    </ul>
  </li>
  <li><strong>Optimize CSS:</strong>
    <ul>
      <li>Inline critical CSS</li>
      <li>Remove unused CSS</li>
      <li>Minify CSS files</li>
    </ul>
  </li>
  <li><strong>Server Optimization:</strong>
    <ul>
      <li>Use a CDN for static assets</li>
      <li>Enable HTTP/2 or HTTP/3</li>
      <li>Implement server-side caching</li>
      <li>Optimize database queries</li>
    </ul>
  </li>
</ol>

<h3>Crawl Budget Optimization</h3>
<ul>
  <li>Fix broken links and 404 errors</li>
  <li>Use robots.txt strategically</li>
  <li>Implement proper redirects (301, not 302)</li>
  <li>Optimize your XML sitemap</li>
</ul>

<h3>Tools for Technical SEO</h3>
<ul>
  <li>Google PageSpeed Insights</li>
  <li>Lighthouse</li>
  <li>WebPageTest</li>
  <li>Screaming Frog SEO Spider</li>
  <li>Google Search Console</li>
</ul>`,
    category: 'Technical SEO',
    difficulty: 'advanced',
    duration: 60,
    tags: JSON.stringify(['technical-seo', 'core-web-vitals', 'page-speed', 'performance']),
    video_url: '',
    resources: JSON.stringify([
      'Google Web.dev Documentation',
      'PageSpeed Insights Tool',
      'Lighthouse Documentation',
      'Screaming Frog User Guide'
    ]),
    favorite: false,
    views: 0
  },
  {
    title: 'Content Marketing & SEO: Creating Ranking Content',
    description: 'Learn how to create content that ranks well in search engines and engages your audience.',
    content: `<h2>Content Marketing for SEO</h2>
<p>Quality content is the foundation of successful SEO. Learn to create content that both users and search engines love.</p>

<h3>Content Research & Planning</h3>
<ol>
  <li><strong>Keyword Research:</strong>
    <ul>
      <li>Identify primary and secondary keywords</li>
      <li>Analyze search intent (informational, transactional, navigational)</li>
      <li>Find long-tail keyword opportunities</li>
    </ul>
  </li>
  <li><strong>Competitive Analysis:</strong>
    <ul>
      <li>Analyze top-ranking content for target keywords</li>
      <li>Identify content gaps</li>
      <li>Find unique angles and perspectives</li>
    </ul>
  </li>
</ol>

<h3>Content Creation Best Practices</h3>
<ul>
  <li><strong>Structure:</strong> Use clear headings (H1, H2, H3) to organize content</li>
  <li><strong>Readability:</strong> Write for your audience, not search engines</li>
  <li><strong>Depth:</strong> Cover topics comprehensively</li>
  <li><strong>Multimedia:</strong> Include images, videos, infographics</li>
  <li><strong>Internal Linking:</strong> Link to related content on your site</li>
</ul>

<h3>On-Page Optimization</h3>
<ul>
  <li>Optimize title tags (50-60 characters)</li>
  <li>Write compelling meta descriptions (150-160 characters)</li>
  <li>Use keywords naturally in headings and content</li>
  <li>Add schema markup for rich snippets</li>
  <li>Optimize images with alt text</li>
</ul>

<h3>Content Promotion Strategy</h3>
<ol>
  <li>Share on social media platforms</li>
  <li>Reach out to influencers and websites for backlinks</li>
  <li>Repurpose content into different formats</li>
  <li>Update and refresh old content regularly</li>
</ol>`,
    category: 'Content Marketing',
    difficulty: 'intermediate',
    duration: 50,
    tags: JSON.stringify(['content-marketing', 'seo-content', 'keyword-research', 'on-page-seo']),
    resources: JSON.stringify([
      'Content Marketing Institute Resources',
      'Ahrefs Content Marketing Guide',
      'HubSpot Content Strategy Templates'
    ]),
    favorite: true,
    views: 0
  },
  {
    title: 'Link Building Strategies That Work in 2025',
    description: 'Modern link building tactics to earn high-quality backlinks and boost your domain authority.',
    content: `<h2>Effective Link Building</h2>
<p>Link building remains one of the most important ranking factors. Learn proven strategies to earn quality backlinks.</p>

<h3>White Hat Link Building Techniques</h3>

<h4>1. Content-Driven Link Acquisition</h4>
<ul>
  <li>Create linkable assets (guides, research, tools)</li>
  <li>Develop original data and studies</li>
  <li>Publish comprehensive how-to guides</li>
  <li>Create infographics and visual content</li>
</ul>

<h4>2. Digital PR & Outreach</h4>
<ul>
  <li>Build relationships with journalists and bloggers</li>
  <li>Respond to HARO (Help A Reporter Out) queries</li>
  <li>Pitch newsworthy stories to media outlets</li>
  <li>Create press releases for major announcements</li>
</ul>

<h4>3. Guest Posting</h4>
<ul>
  <li>Identify high-quality websites in your niche</li>
  <li>Pitch unique, valuable content ideas</li>
  <li>Focus on relevance over quantity</li>
  <li>Build genuine relationships with site owners</li>
</ul>

<h4>4. Broken Link Building</h4>
<ol>
  <li>Find broken links on relevant websites</li>
  <li>Create or identify replacement content</li>
  <li>Reach out to webmasters with your solution</li>
  <li>Offer value before asking for a link</li>
</ol>

<h3>Link Quality Metrics</h3>
<ul>
  <li><strong>Domain Authority:</strong> Target sites with high DA</li>
  <li><strong>Relevance:</strong> Links from topically related sites</li>
  <li><strong>Traffic:</strong> Sites with real organic traffic</li>
  <li><strong>Link Placement:</strong> Editorial links in content</li>
  <li><strong>Anchor Text:</strong> Natural, varied anchor text</li>
</ul>

<h3>Link Building Tools</h3>
<ul>
  <li>Ahrefs - Backlink analysis and prospecting</li>
  <li>SEMrush - Link building toolkit</li>
  <li>BuzzStream - Outreach management</li>
  <li>Hunter.io - Email finder</li>
  <li>Pitchbox - Outreach automation</li>
</ul>

<h3>What to Avoid</h3>
<ul>
  <li>Buying links</li>
  <li>Link exchanges (excessive)</li>
  <li>Low-quality directory submissions</li>
  <li>Comment spam</li>
  <li>Private blog networks (PBNs)</li>
</ul>`,
    category: 'Link Building',
    difficulty: 'advanced',
    duration: 55,
    tags: JSON.stringify(['link-building', 'backlinks', 'digital-pr', 'guest-posting']),
    resources: JSON.stringify([
      'Ahrefs Link Building Guide',
      'Backlinko Link Building Strategies',
      'Moz Link Building Resources'
    ]),
    favorite: false,
    views: 0
  }
];

async function seedTutorials() {
  console.log('Starting tutorial seeding...\n');

  try {
    // Check if tutorials already exist
    const { data: existingTutorials, error: checkError } = await supabase
      .from('crm_tutorials')
      .select('id');

    if (checkError) {
      throw new Error(`Error checking existing tutorials: ${checkError.message}`);
    }

    if (existingTutorials && existingTutorials.length > 0) {
      console.log(`Found ${existingTutorials.length} existing tutorials.`);
      const readline = await import('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });

      const answer = await new Promise((resolve) => {
        rl.question('Do you want to add more sample tutorials? (y/n): ', resolve);
      });

      rl.close();

      if (answer.toLowerCase() !== 'y') {
        console.log('Seeding cancelled.');
        process.exit(0);
      }
    }

    // Insert tutorials
    console.log(`Inserting ${sampleTutorials.length} sample tutorials...\n`);

    for (const tutorial of sampleTutorials) {
      const { data, error } = await supabase
        .from('crm_tutorials')
        .insert([tutorial])
        .select();

      if (error) {
        console.error(`Error inserting tutorial "${tutorial.title}":`, error.message);
      } else {
        console.log(`✓ Created: ${tutorial.title}`);
      }
    }

    console.log('\n✅ Tutorial seeding completed successfully!');
    console.log(`\nTotal tutorials in database: ${(existingTutorials?.length || 0) + sampleTutorials.length}`);

  } catch (error) {
    console.error('Error seeding tutorials:', error.message);
    process.exit(1);
  }
}

seedTutorials();
