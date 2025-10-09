#!/usr/bin/env node

/**
 * SEO Competitor Analyzer
 * Uses Playwright MCP Docker container to analyze competitor websites
 */

const { execSync } = require('child_process');

const targetUrl = process.argv[2] || 'https://example.com';

console.log('🔍 SEO Competitor Analyzer');
console.log('📍 Target URL:', targetUrl);
console.log('');

// Playwright script to extract SEO data
const playwrightScript = `
const playwright = require('playwright');

(async () => {
  try {
    const browser = await playwright.chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 SEO-Analyzer/1.0'
    });

    const page = await context.newPage();

    console.log('⏳ Loading page...');
    await page.goto('${targetUrl}', { waitUntil: 'networkidle', timeout: 30000 });

    console.log('✅ Page loaded!');
    console.log('');

    // Extract SEO data
    const seoData = await page.evaluate(() => {
      // Title
      const title = document.title;

      // Meta description
      const metaDesc = document.querySelector('meta[name="description"]')?.content || '';

      // Meta keywords
      const metaKeywords = document.querySelector('meta[name="keywords"]')?.content || '';

      // Open Graph data
      const ogTitle = document.querySelector('meta[property="og:title"]')?.content || '';
      const ogDesc = document.querySelector('meta[property="og:description"]')?.content || '';
      const ogImage = document.querySelector('meta[property="og:image"]')?.content || '';

      // Twitter Card
      const twitterCard = document.querySelector('meta[name="twitter:card"]')?.content || '';
      const twitterTitle = document.querySelector('meta[name="twitter:title"]')?.content || '';

      // Headings
      const h1s = Array.from(document.querySelectorAll('h1')).map(h => h.textContent.trim());
      const h2s = Array.from(document.querySelectorAll('h2')).map(h => h.textContent.trim());

      // Canonical URL
      const canonical = document.querySelector('link[rel="canonical"]')?.href || '';

      // Robots meta
      const robots = document.querySelector('meta[name="robots"]')?.content || '';

      // Schema.org structured data
      const schemaScripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'))
        .map(s => {
          try {
            return JSON.parse(s.textContent);
          } catch (e) {
            return null;
          }
        })
        .filter(Boolean);

      // Images
      const images = Array.from(document.querySelectorAll('img'));
      const imagesWithoutAlt = images.filter(img => !img.alt).length;

      // Links
      const links = Array.from(document.querySelectorAll('a'));
      const internalLinks = links.filter(a => a.href && a.hostname === window.location.hostname).length;
      const externalLinks = links.filter(a => a.href && a.hostname !== window.location.hostname).length;

      // Page speed hints
      const resourceCount = performance.getEntriesByType('resource').length;

      return {
        title,
        titleLength: title.length,
        metaDescription: metaDesc,
        metaDescLength: metaDesc.length,
        metaKeywords,
        canonical,
        robots,
        openGraph: {
          title: ogTitle,
          description: ogDesc,
          image: ogImage
        },
        twitter: {
          card: twitterCard,
          title: twitterTitle
        },
        headings: {
          h1: h1s,
          h1Count: h1s.length,
          h2: h2s.slice(0, 5), // First 5 H2s
          h2Count: h2s.length
        },
        images: {
          total: images.length,
          missingAlt: imagesWithoutAlt
        },
        links: {
          internal: internalLinks,
          external: externalLinks
        },
        schema: schemaScripts,
        performance: {
          resourceCount
        }
      };
    });

    // Performance timing
    const perfData = await page.evaluate(() => {
      const perf = performance.timing;
      return {
        loadTime: perf.loadEventEnd - perf.navigationStart,
        domReady: perf.domContentLoadedEventEnd - perf.navigationStart,
        ttfb: perf.responseStart - perf.navigationStart
      };
    });

    // Take screenshot
    await page.screenshot({ path: '/tmp/competitor-screenshot.png', fullPage: false });

    await browser.close();

    // Output results
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📊 SEO ANALYSIS RESULTS');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');

    console.log('📄 PAGE TITLE');
    console.log('  ', seoData.title);
    console.log('  ', 'Length:', seoData.titleLength, seoData.titleLength < 60 ? '✅' : '⚠️  (too long)');
    console.log('');

    console.log('📝 META DESCRIPTION');
    console.log('  ', seoData.metaDescription || '❌ Missing');
    console.log('  ', 'Length:', seoData.metaDescLength, seoData.metaDescLength >= 120 && seoData.metaDescLength <= 160 ? '✅' : '⚠️');
    console.log('');

    console.log('🏷️  META KEYWORDS');
    console.log('  ', seoData.metaKeywords || '❌ None');
    console.log('');

    console.log('🔗 CANONICAL URL');
    console.log('  ', seoData.canonical || '❌ Missing');
    console.log('');

    console.log('🤖 ROBOTS');
    console.log('  ', seoData.robots || 'Default (index, follow)');
    console.log('');

    console.log('📰 OPEN GRAPH');
    console.log('  ', 'Title:', seoData.openGraph.title || '❌ Missing');
    console.log('  ', 'Description:', seoData.openGraph.description || '❌ Missing');
    console.log('  ', 'Image:', seoData.openGraph.image || '❌ Missing');
    console.log('');

    console.log('🐦 TWITTER CARD');
    console.log('  ', 'Type:', seoData.twitter.card || '❌ Missing');
    console.log('  ', 'Title:', seoData.twitter.title || '❌ Missing');
    console.log('');

    console.log('📋 HEADINGS');
    console.log('  ', 'H1:', seoData.headings.h1Count, seoData.headings.h1Count === 1 ? '✅' : '⚠️');
    if (seoData.headings.h1.length > 0) {
      console.log('  ', '  ➜', seoData.headings.h1[0]);
    }
    console.log('  ', 'H2:', seoData.headings.h2Count);
    if (seoData.headings.h2.length > 0) {
      seoData.headings.h2.forEach(h => console.log('  ', '  ➜', h));
    }
    console.log('');

    console.log('🖼️  IMAGES');
    console.log('  ', 'Total:', seoData.images.total);
    console.log('  ', 'Missing ALT:', seoData.images.missingAlt, seoData.images.missingAlt === 0 ? '✅' : '⚠️');
    console.log('');

    console.log('🔗 LINKS');
    console.log('  ', 'Internal:', seoData.links.internal);
    console.log('  ', 'External:', seoData.links.external);
    console.log('');

    console.log('📐 STRUCTURED DATA');
    console.log('  ', 'Schema.org scripts:', seoData.schema.length, seoData.schema.length > 0 ? '✅' : '⚠️');
    if (seoData.schema.length > 0) {
      seoData.schema.forEach(schema => {
        console.log('  ', '  ➜ Type:', schema['@type'] || 'Unknown');
      });
    }
    console.log('');

    console.log('⚡ PERFORMANCE');
    console.log('  ', 'Load Time:', perfData.loadTime, 'ms', perfData.loadTime < 3000 ? '✅' : '⚠️');
    console.log('  ', 'DOM Ready:', perfData.domReady, 'ms');
    console.log('  ', 'TTFB:', perfData.ttfb, 'ms', perfData.ttfb < 600 ? '✅' : '⚠️');
    console.log('  ', 'Resources:', seoData.performance.resourceCount);
    console.log('');

    console.log('═══════════════════════════════════════════════════════════');
    console.log('✅ Analysis complete!');
    console.log('📸 Screenshot saved to: /tmp/competitor-screenshot.png');
    console.log('');

    // Return JSON for programmatic use
    const result = {
      url: '${targetUrl}',
      timestamp: new Date().toISOString(),
      seo: seoData,
      performance: perfData
    };

    console.log('📄 JSON Output:');
    console.log(JSON.stringify(result, null, 2));

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
})();
`;

console.log('🚀 Starting Playwright in Docker container...');
console.log('');

try {
  // Execute Playwright script in Docker container
  const result = execSync(
    `docker exec -i geo-seo-playwright-mcp node -e "${playwrightScript.replace(/"/g, '\\"')}"`,
    {
      encoding: 'utf8',
      maxBuffer: 10 * 1024 * 1024, // 10MB buffer
      timeout: 60000 // 60 second timeout
    }
  );

  console.log(result);

} catch (error) {
  console.error('❌ Failed to analyze competitor:');
  console.error(error.message);
  console.error('');
  console.error('💡 Make sure Playwright MCP container is running:');
  console.error('   docker ps | grep playwright');
  process.exit(1);
}
