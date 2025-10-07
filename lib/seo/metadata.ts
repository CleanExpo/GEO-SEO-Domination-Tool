import { Metadata } from 'next'

export interface SEOConfig {
  title?: string
  description?: string
  keywords?: string[]
  author?: string
  image?: string
  url?: string
  type?: 'website' | 'article' | 'profile'
  publishedTime?: string
  modifiedTime?: string
  section?: string
  tags?: string[]
  noIndex?: boolean
}

const defaultConfig = {
  siteName: 'GEO-SEO Domination Tool',
  defaultTitle: 'GEO-SEO Domination Tool - Local SEO & Ranking Analysis',
  defaultDescription:
    'Advanced local SEO and GEO ranking analysis tool. Track keywords, monitor rankings, analyze competitors, and dominate local search results.',
  defaultUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://geo-seo-domination-tool.vercel.app',
  defaultImage: '/og-image.png',
  twitterHandle: '@geoseodomination',
  author: 'GEO-SEO Domination Team',
  defaultKeywords: [
    'SEO',
    'local SEO',
    'GEO ranking',
    'keyword tracking',
    'SERP analysis',
    'competitor analysis',
    'SEO tools',
    'ranking tracker',
  ],
}

/**
 * Generate SEO metadata for a page
 */
export function generateMetadata(config: SEOConfig = {}): Metadata {
  const title = config.title
    ? `${config.title} | ${defaultConfig.siteName}`
    : defaultConfig.defaultTitle

  const description = config.description || defaultConfig.defaultDescription
  const keywords = config.keywords || defaultConfig.defaultKeywords
  const author = config.author || defaultConfig.author
  const image = config.image || defaultConfig.defaultImage
  const url = config.url || defaultConfig.defaultUrl
  const type = config.type || 'website'

  // Construct absolute image URL
  const imageUrl = image.startsWith('http')
    ? image
    : `${defaultConfig.defaultUrl}${image}`

  // Construct absolute page URL
  const pageUrl = url.startsWith('http') ? url : `${defaultConfig.defaultUrl}${url}`

  const metadata: Metadata = {
    title,
    description,
    keywords: keywords.join(', '),
    authors: [{ name: author }],
    creator: author,
    publisher: defaultConfig.siteName,

    // Open Graph
    openGraph: {
      title,
      description,
      url: pageUrl,
      siteName: defaultConfig.siteName,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      locale: 'en_US',
      type,
    },

    // Twitter
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      creator: defaultConfig.twitterHandle,
      images: [imageUrl],
    },

    // Robots
    robots: {
      index: !config.noIndex,
      follow: !config.noIndex,
      googleBot: {
        index: !config.noIndex,
        follow: !config.noIndex,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },

    // Verification (add your verification codes)
    verification: {
      google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION,
      yandex: process.env.NEXT_PUBLIC_YANDEX_VERIFICATION,
      // bing: process.env.NEXT_PUBLIC_BING_VERIFICATION,
    },
  }

  // Add article-specific metadata if type is 'article'
  if (type === 'article' && metadata.openGraph) {
    metadata.openGraph = {
      ...metadata.openGraph,
      type: 'article',
      publishedTime: config.publishedTime,
      modifiedTime: config.modifiedTime,
      section: config.section,
      tags: config.tags,
      authors: [author],
    }
  }

  return metadata
}

/**
 * Predefined metadata for common pages
 */
export const PageMetadata = {
  home: (): Metadata =>
    generateMetadata({
      title: 'Home',
      description:
        'Advanced local SEO and GEO ranking analysis tool. Track keywords, monitor rankings, analyze competitors, and dominate local search results.',
      keywords: [
        'SEO tool',
        'local SEO',
        'GEO ranking',
        'keyword tracker',
        'SERP analysis',
        'SEO dashboard',
      ],
      url: '/',
    }),

  companies: (): Metadata =>
    generateMetadata({
      title: 'Companies',
      description:
        'Manage your client companies and track their SEO performance. Monitor rankings, analyze keywords, and improve local search visibility.',
      keywords: [
        'SEO companies',
        'client management',
        'business SEO',
        'local business ranking',
      ],
      url: '/companies',
    }),

  keywords: (): Metadata =>
    generateMetadata({
      title: 'Keyword Tracking',
      description:
        'Track keyword rankings across search engines. Monitor SERP positions, analyze keyword performance, and identify ranking opportunities.',
      keywords: [
        'keyword tracking',
        'keyword ranking',
        'SERP tracking',
        'keyword analysis',
        'keyword research',
      ],
      url: '/keywords',
    }),

  rankings: (): Metadata =>
    generateMetadata({
      title: 'Ranking Analysis',
      description:
        'Analyze search engine rankings and track position changes over time. Visualize ranking trends and identify ranking factors.',
      keywords: [
        'ranking analysis',
        'SERP analysis',
        'ranking tracker',
        'position tracking',
        'search ranking',
      ],
      url: '/rankings',
    }),

  seoAudits: (): Metadata =>
    generateMetadata({
      title: 'SEO Audits',
      description:
        'Comprehensive SEO audits for your websites. Analyze technical SEO, on-page factors, backlinks, and get actionable recommendations.',
      keywords: [
        'SEO audit',
        'website audit',
        'technical SEO',
        'SEO analysis',
        'SEO report',
      ],
      url: '/seo-audits',
    }),

  crm: (): Metadata =>
    generateMetadata({
      title: 'CRM',
      description:
        'Manage client relationships, track deals, schedule tasks, and organize contacts. All-in-one CRM for SEO agencies.',
      keywords: [
        'CRM',
        'client management',
        'deal tracking',
        'contact management',
        'SEO CRM',
      ],
      url: '/crm',
    }),

  projects: (): Metadata =>
    generateMetadata({
      title: 'Projects',
      description:
        'Manage SEO projects, track progress, and collaborate with your team. Organize campaigns and deliverables in one place.',
      keywords: [
        'project management',
        'SEO projects',
        'campaign management',
        'project tracking',
      ],
      url: '/projects',
    }),

  resources: (): Metadata =>
    generateMetadata({
      title: 'Resources',
      description:
        'Access SEO prompts, components, AI tools, and tutorials. Community-curated resources for SEO professionals.',
      keywords: [
        'SEO resources',
        'SEO tools',
        'SEO prompts',
        'SEO tutorials',
        'SEO components',
      ],
      url: '/resources',
    }),

  analytics: (): Metadata =>
    generateMetadata({
      title: 'Analytics',
      description:
        'View comprehensive SEO analytics and performance metrics. Track traffic, conversions, and ROI for your SEO campaigns.',
      keywords: [
        'SEO analytics',
        'performance metrics',
        'SEO reporting',
        'traffic analysis',
        'conversion tracking',
      ],
      url: '/analytics',
    }),

  login: (): Metadata =>
    generateMetadata({
      title: 'Login',
      description: 'Sign in to your GEO-SEO Domination Tool account.',
      keywords: ['login', 'sign in', 'authentication'],
      url: '/login',
      noIndex: true, // Don't index auth pages
    }),

  signup: (): Metadata =>
    generateMetadata({
      title: 'Sign Up',
      description: 'Create your GEO-SEO Domination Tool account and start tracking your SEO performance.',
      keywords: ['sign up', 'register', 'create account'],
      url: '/signup',
      noIndex: true, // Don't index auth pages
    }),
}

/**
 * Generate JSON-LD structured data
 */
export function generateStructuredData(type: 'Organization' | 'WebSite' | 'SoftwareApplication', data?: any) {
  const baseUrl = defaultConfig.defaultUrl

  if (type === 'Organization') {
    return {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: defaultConfig.siteName,
      url: baseUrl,
      logo: `${baseUrl}/logo.png`,
      description: defaultConfig.defaultDescription,
      sameAs: [
        // Add your social media URLs
        'https://twitter.com/geoseodomination',
        'https://linkedin.com/company/geoseodomination',
      ],
      ...data,
    }
  }

  if (type === 'WebSite') {
    return {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: defaultConfig.siteName,
      url: baseUrl,
      description: defaultConfig.defaultDescription,
      potentialAction: {
        '@type': 'SearchAction',
        target: `${baseUrl}/search?q={search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
      ...data,
    }
  }

  if (type === 'SoftwareApplication') {
    return {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: defaultConfig.siteName,
      applicationCategory: 'BusinessApplication',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      },
      operatingSystem: 'Web',
      description: defaultConfig.defaultDescription,
      ...data,
    }
  }

  return {}
}
