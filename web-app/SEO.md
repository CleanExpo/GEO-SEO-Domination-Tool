# SEO Implementation Guide

## Overview

This application has comprehensive SEO implementation with:

- ✅ Per-page metadata (title, description, keywords, Open Graph, Twitter Cards)
- ✅ JSON-LD structured data (Organization, WebSite, SoftwareApplication)
- ✅ Dynamic metadata for all routes
- ✅ Social media preview optimization
- ✅ Search engine verification support

## Adding Metadata to Pages

### Method 1: Using Predefined Metadata (Recommended)

For standard pages, use the predefined metadata from `lib/seo/metadata.ts`:

#### Server Components (Static Pages)

```typescript
// app/companies/page.tsx
import { PageMetadata } from '@/lib/seo/metadata'

export const metadata = PageMetadata.companies()

export default function CompaniesPage() {
  // Your page content
}
```

#### Available Predefined Metadata

- `PageMetadata.home()` - Home page
- `PageMetadata.companies()` - Companies list
- `PageMetadata.keywords()` - Keywords tracking
- `PageMetadata.rankings()` - Ranking analysis
- `PageMetadata.seoAudits()` - SEO audits
- `PageMetadata.crm()` - CRM section
- `PageMetadata.projects()` - Projects
- `PageMetadata.resources()` - Resources
- `PageMetadata.analytics()` - Analytics
- `PageMetadata.login()` - Login page (noIndex)
- `PageMetadata.signup()` - Signup page (noIndex)

### Method 2: Custom Metadata

For pages with dynamic content or custom requirements:

```typescript
// app/blog/[slug]/page.tsx
import { generateMetadata as generateSEOMetadata } from '@/lib/seo/metadata'
import { Metadata } from 'next'

interface Props {
  params: { slug: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  // Fetch blog post data
  const post = await fetchBlogPost(params.slug)

  return generateSEOMetadata({
    title: post.title,
    description: post.excerpt,
    keywords: post.tags,
    image: post.coverImage,
    url: `/blog/${params.slug}`,
    type: 'article',
    publishedTime: post.publishedAt,
    modifiedTime: post.updatedAt,
    section: 'Blog',
    tags: post.tags,
  })
}

export default async function BlogPostPage({ params }: Props) {
  const post = await fetchBlogPost(params.slug)
  // Render post
}
```

### Method 3: Dynamic Company Pages

```typescript
// app/companies/[id]/page.tsx
import { generateMetadata as generateSEOMetadata } from '@/lib/seo/metadata'
import { Metadata } from 'next'

interface Props {
  params: { id: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const company = await fetchCompany(params.id)

  return generateSEOMetadata({
    title: `${company.name} - SEO Analysis`,
    description: `Track SEO performance, keywords, and rankings for ${company.name}. Comprehensive SEO analytics and reporting.`,
    keywords: [
      company.name,
      'SEO analysis',
      'keyword tracking',
      'ranking analysis',
      company.industry,
      company.location,
    ].filter(Boolean),
    url: `/companies/${params.id}`,
    image: company.logo || undefined,
  })
}

export default async function CompanyDetailPage({ params }: Props) {
  const company = await fetchCompany(params.id)
  // Render company details
}
```

## Metadata Configuration

### SEOConfig Interface

```typescript
interface SEOConfig {
  title?: string              // Page title (will be appended with site name)
  description?: string        // Meta description (160 chars recommended)
  keywords?: string[]         // Keywords array
  author?: string            // Page author
  image?: string             // Social media preview image (1200x630 recommended)
  url?: string               // Canonical URL
  type?: 'website' | 'article' | 'profile'  // Open Graph type
  publishedTime?: string     // Article published date (ISO format)
  modifiedTime?: string      // Article modified date (ISO format)
  section?: string           // Article section/category
  tags?: string[]            // Article tags
  noIndex?: boolean          // Prevent search engine indexing
}
```

### Default Configuration

Defaults are defined in `lib/seo/metadata.ts`:

```typescript
const defaultConfig = {
  siteName: 'GEO-SEO Domination Tool',
  defaultTitle: 'GEO-SEO Domination Tool - Local SEO & Ranking Analysis',
  defaultDescription: 'Advanced local SEO and GEO ranking analysis tool...',
  defaultUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://geo-seo-domination-tool.vercel.app',
  defaultImage: '/og-image.png',
  twitterHandle: '@geoseodomination',
  author: 'GEO-SEO Domination Team',
  defaultKeywords: [
    'SEO',
    'local SEO',
    'GEO ranking',
    'keyword tracking',
    // ...
  ],
}
```

## Generated Meta Tags

When you use `generateMetadata()`, it automatically generates:

### Basic HTML Meta Tags

```html
<title>Your Page Title | GEO-SEO Domination Tool</title>
<meta name="description" content="Your page description" />
<meta name="keywords" content="seo, local seo, keyword tracking" />
<meta name="author" content="GEO-SEO Domination Team" />
```

### Open Graph Tags (Facebook, LinkedIn)

```html
<meta property="og:title" content="Your Page Title | GEO-SEO Domination Tool" />
<meta property="og:description" content="Your page description" />
<meta property="og:url" content="https://yoursite.com/page" />
<meta property="og:site_name" content="GEO-SEO Domination Tool" />
<meta property="og:image" content="https://yoursite.com/og-image.png" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:locale" content="en_US" />
<meta property="og:type" content="website" />
```

### Twitter Card Tags

```html
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="Your Page Title | GEO-SEO Domination Tool" />
<meta name="twitter:description" content="Your page description" />
<meta name="twitter:creator" content="@geoseodomination" />
<meta name="twitter:image" content="https://yoursite.com/og-image.png" />
```

### Robots Meta Tags

```html
<meta name="robots" content="index, follow" />
<meta name="googlebot" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
```

For noIndex pages (login, signup):

```html
<meta name="robots" content="noindex, nofollow" />
```

## Structured Data (JSON-LD)

### Organization Schema

Automatically added to root layout:

```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "GEO-SEO Domination Tool",
  "url": "https://geo-seo-domination-tool.vercel.app",
  "logo": "https://geo-seo-domination-tool.vercel.app/logo.png",
  "description": "Advanced local SEO and GEO ranking analysis tool...",
  "sameAs": [
    "https://twitter.com/geoseodomination",
    "https://linkedin.com/company/geoseodomination"
  ]
}
```

### WebSite Schema

Enables site search in Google:

```json
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "GEO-SEO Domination Tool",
  "url": "https://geo-seo-domination-tool.vercel.app",
  "description": "Advanced local SEO and GEO ranking analysis tool...",
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://geo-seo-domination-tool.vercel.app/search?q={search_term_string}",
    "query-input": "required name=search_term_string"
  }
}
```

### SoftwareApplication Schema

Helps Google understand your app:

```json
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "GEO-SEO Domination Tool",
  "applicationCategory": "BusinessApplication",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  },
  "operatingSystem": "Web",
  "description": "Advanced local SEO and GEO ranking analysis tool..."
}
```

### Custom Structured Data

For specific pages:

```typescript
import { generateStructuredData } from '@/lib/seo/metadata'

export default function CompanyPage({ company }) {
  const companySchema = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: company.name,
    url: company.website,
    address: {
      '@type': 'PostalAddress',
      addressLocality: company.location,
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(companySchema) }}
      />
      {/* Page content */}
    </>
  )
}
```

## Environment Variables

### Required for SEO

```env
# App URL (for canonical URLs and Open Graph)
NEXT_PUBLIC_APP_URL=https://geo-seo-domination-tool.vercel.app

# Search engine verification (optional)
NEXT_PUBLIC_GOOGLE_VERIFICATION=your-google-verification-code
NEXT_PUBLIC_YANDEX_VERIFICATION=your-yandex-verification-code
NEXT_PUBLIC_BING_VERIFICATION=your-bing-verification-code
```

## Social Media Preview Images

### Image Requirements

- **Dimensions:** 1200 x 630 pixels (recommended)
- **Format:** PNG or JPG
- **File size:** Under 1 MB
- **Aspect ratio:** 1.91:1

### Creating OG Images

1. **Static OG Image:** Place in `public/og-image.png`

2. **Dynamic OG Images:** Use Next.js Image Generation API

```typescript
// app/api/og/route.tsx
import { ImageResponse } from 'next/og'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const title = searchParams.get('title') || 'GEO-SEO Domination Tool'

  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(to bottom right, #10b981, #14b8a6)',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <h1 style={{ fontSize: 72, color: 'white' }}>{title}</h1>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  )
}
```

Use in metadata:

```typescript
export const metadata = generateSEOMetadata({
  title: 'My Page',
  image: `/api/og?title=${encodeURIComponent('My Page')}`,
})
```

## Testing SEO

### Tools for Testing

1. **Social Media Preview Testers:**
   - [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/)
   - [Twitter Card Validator](https://cards-dev.twitter.com/validator)
   - [LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/)

2. **SEO Analysis:**
   - [Google Rich Results Test](https://search.google.com/test/rich-results)
   - [Schema Markup Validator](https://validator.schema.org/)
   - [SEO Meta Inspector](https://www.seomofo.com/snippet-optimizer.html)

3. **Local Testing:**

```bash
# Build and preview
npm run build
npm run start

# Test metadata
curl -I http://localhost:3000/companies
# Look for meta tags in response
```

### Manual Testing Checklist

- [ ] Title displays correctly in browser tab
- [ ] Description appears in search results preview
- [ ] Open Graph image shows correctly when sharing on Facebook/LinkedIn
- [ ] Twitter Card displays properly when sharing on Twitter
- [ ] Structured data passes Rich Results Test
- [ ] Canonical URLs are correct
- [ ] No duplicate meta tags
- [ ] noIndex is set for auth pages only

## Best Practices

### Title Tags

✅ **DO:**
- Keep under 60 characters
- Include primary keyword
- Make it unique per page
- Front-load important keywords
- Include brand name at the end

❌ **DON'T:**
- Stuff keywords
- Use all caps
- Duplicate titles across pages
- Make it too generic

### Meta Descriptions

✅ **DO:**
- Keep between 150-160 characters
- Include target keywords naturally
- Write compelling copy
- Include a call-to-action
- Make it unique per page

❌ **DON'T:**
- Duplicate across pages
- Stuff keywords
- Use quotation marks (breaks formatting)
- Leave it empty

### Keywords

✅ **DO:**
- Focus on 5-10 relevant keywords
- Include long-tail variations
- Research competitor keywords
- Update based on performance

❌ **DON'T:**
- Keyword stuff (outdated practice)
- Use irrelevant keywords
- Repeat the same keyword multiple times

### Images

✅ **DO:**
- Use 1200x630 for OG images
- Optimize file size (< 1 MB)
- Use descriptive filenames
- Include alt text
- Test on all platforms

❌ **DON'T:**
- Use images with text (hard to read at small sizes)
- Forget mobile preview
- Use copyrighted images

## Monitoring SEO Performance

### Google Search Console

1. Verify site ownership
2. Submit sitemap
3. Monitor impressions, clicks, CTR
4. Fix crawl errors
5. Track rich results

### Analytics Integration

Track SEO performance:

```typescript
// lib/analytics.ts
export function trackPageView(url: string, title: string) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', 'GA_MEASUREMENT_ID', {
      page_path: url,
      page_title: title,
    })
  }
}
```

Use in pages:

```typescript
'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { trackPageView } from '@/lib/analytics'

export default function AnalyticsWrapper({ children }) {
  const pathname = usePathname()

  useEffect(() => {
    trackPageView(pathname, document.title)
  }, [pathname])

  return children
}
```

## Common SEO Issues & Fixes

### Issue: Pages not indexing

**Solution:**
1. Remove `noIndex` from metadata
2. Submit to Google Search Console
3. Check robots.txt doesn't block pages
4. Ensure sitemap.xml includes all pages

### Issue: Duplicate meta tags

**Solution:**
- Remove hardcoded meta tags from `app/layout.tsx`
- Use `generateMetadata()` for all pages
- Check for conflicting metadata in parent layouts

### Issue: Images not showing in social previews

**Solution:**
1. Use absolute URLs for images
2. Verify image dimensions (1200x630)
3. Clear Facebook/Twitter cache
4. Test with preview tools

### Issue: Structured data errors

**Solution:**
1. Validate with Schema.org validator
2. Ensure all required fields are present
3. Use correct schema types
4. Escape special characters in JSON

## Resources

- [Next.js Metadata API](https://nextjs.org/docs/app/building-your-application/optimizing/metadata)
- [Open Graph Protocol](https://ogp.me/)
- [Twitter Card Documentation](https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/abouts-cards)
- [Schema.org Documentation](https://schema.org/docs/documents.html)
- [Google Search Central](https://developers.google.com/search)
