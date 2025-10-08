#!/usr/bin/env node

/**
 * Test Content Generation Pipeline
 *
 * Tests the complete autonomous content generation system:
 * 1. Deep Research Agent
 * 2. Visual Content Agent
 * 3. Content Generation Agent
 * 4. API Endpoint
 */

const API_URL = 'http://localhost:3000/api/crm/content/generate';

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

/**
 * Test content generation
 */
async function testContentGeneration() {
  log('\n========================================', colors.cyan);
  log('  Content Generation Pipeline Test', colors.cyan + colors.bright);
  log('========================================\n', colors.cyan);

  // Test Case 1: Blog Article (Unite Group topic)
  log('Test 1: Blog Article - Fire Damage Restoration', colors.blue);
  log('----------------------------------------', colors.blue);

  const blogRequest = {
    type: 'blog',
    topic: 'Advanced Fire Damage Restoration Techniques',
    industry: 'Disaster Recovery',
    targetAudience: 'professionals',
    targetKeywords: [
      'fire damage restoration',
      'smoke odor removal',
      'structural drying',
      'fire resistant materials'
    ],
    tone: 'professional',
    researchDepth: 4,
    includeImages: true,
    includeInfographics: true,
    includeDiagrams: true,
    targetWordCount: 1500,
    optimizeForSEO: true,
    saveToDatabase: true
  };

  try {
    log('Sending request to API...', colors.yellow);
    const startTime = Date.now();

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(blogRequest)
    });

    const data = await response.json();
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    if (data.success) {
      log(`\n✅ Blog Article Generated in ${duration}s`, colors.green + colors.bright);
      log('', colors.reset);
      log(`Title: ${data.content.title}`, colors.cyan);
      log(`Subtitle: ${data.content.subtitle || 'N/A'}`, colors.cyan);
      log(`Summary: ${data.content.summary.substring(0, 150)}...`, colors.cyan);
      log('', colors.reset);
      log('Metrics:', colors.blue);
      log(`  SEO Score: ${data.metrics.seoScore}/100`, colors.green);
      log(`  Readability: ${data.metrics.readabilityScore}/100`, colors.green);
      log(`  Originality: ${data.metrics.originalityScore}/100`, colors.green);
      log(`  Credibility: ${data.metrics.credibilityScore}/100`, colors.green);
      log(`  Word Count: ${data.metrics.wordCount}`, colors.green);
      log(`  Read Time: ${data.metrics.estimatedReadTime} min`, colors.green);
      log(`  Generation Cost: $${data.metrics.cost.toFixed(4)}`, colors.green);
      log('', colors.reset);
      log('Visual Assets:', colors.blue);
      log(`  Featured Image: ${data.content.featuredImage ? '✓' : '✗'}`, colors.cyan);
      log(`  Images: ${data.content.images.length}`, colors.cyan);
      log(`  Infographics: ${data.content.infographics.length}`, colors.cyan);
      log(`  Diagrams: ${data.content.diagrams.length}`, colors.cyan);
      log('', colors.reset);
      log('SEO Metadata:', colors.blue);
      log(`  Meta Title: ${data.content.meta.title}`, colors.cyan);
      log(`  Meta Desc: ${data.content.meta.description.substring(0, 100)}...`, colors.cyan);
      log(`  Keywords: ${data.content.keywords.join(', ')}`, colors.cyan);
      log('', colors.reset);
      log(`Citations: ${data.content.citations.length} sources`, colors.blue);
      if (data.content.citations.length > 0) {
        data.content.citations.slice(0, 3).forEach((citation, i) => {
          log(`  ${i + 1}. ${citation}`, colors.cyan);
        });
      }
      log('', colors.reset);
      log(`Publish Ready: ${data.content.publishReady ? '✓ YES' : '✗ NO'}`,
        data.content.publishReady ? colors.green : colors.red);
      log('', colors.reset);
      log('Content Preview:', colors.blue);
      log(data.content.content.substring(0, 500) + '...', colors.cyan);

    } else {
      log(`\n✗ Blog generation failed: ${data.error}`, colors.red);
      if (data.details) {
        log(data.details, colors.red);
      }
    }

  } catch (error) {
    log(`\n✗ Request failed: ${error.message}`, colors.red);
    console.error(error);
  }

  log('\n========================================\n', colors.cyan);

  // Test Case 2: Social Media Post
  log('Test 2: Social Media Post - LinkedIn', colors.blue);
  log('----------------------------------------', colors.blue);

  const socialRequest = {
    type: 'social_post',
    topic: 'VOC Testing in Commercial Buildings',
    industry: 'Building Safety',
    targetAudience: 'professionals',
    tone: 'professional',
    platform: 'linkedin',
    includeImages: true,
    saveToDatabase: true
  };

  try {
    log('Sending request to API...', colors.yellow);
    const startTime = Date.now();

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(socialRequest)
    });

    const data = await response.json();
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    if (data.success) {
      log(`\n✅ Social Post Generated in ${duration}s`, colors.green + colors.bright);
      log('', colors.reset);
      log(`Title: ${data.content.title}`, colors.cyan);
      log(`Content:\n${data.content.content}`, colors.cyan);
      log('', colors.reset);
      log(`Tags: ${data.content.tags.join(' ')}`, colors.blue);
      log(`Graphic: ${data.content.featuredImage ? data.content.featuredImage.url : 'N/A'}`, colors.cyan);
      log(`Cost: $${data.metrics.cost.toFixed(4)}`, colors.green);

    } else {
      log(`\n✗ Social post generation failed: ${data.error}`, colors.red);
    }

  } catch (error) {
    log(`\n✗ Request failed: ${error.message}`, colors.red);
  }

  log('\n========================================\n', colors.cyan);

  // Test Case 3: White Paper
  log('Test 3: White Paper - Mould Remediation', colors.blue);
  log('----------------------------------------', colors.blue);

  const whitePaperRequest = {
    type: 'white_paper',
    topic: 'Comprehensive Guide to Mould Remediation in Water-Damaged Buildings',
    industry: 'Disaster Recovery',
    targetAudience: 'industry_experts',
    targetKeywords: [
      'mould remediation',
      'water damage',
      'indoor air quality',
      'building safety'
    ],
    tone: 'technical',
    researchDepth: 5,
    includeInfographics: true,
    includeDiagrams: true,
    optimizeForSEO: true,
    saveToDatabase: true
  };

  try {
    log('Sending request to API...', colors.yellow);
    log('(This will take longer - thesis-level research)', colors.yellow);
    const startTime = Date.now();

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(whitePaperRequest)
    });

    const data = await response.json();
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    if (data.success) {
      log(`\n✅ White Paper Generated in ${duration}s`, colors.green + colors.bright);
      log('', colors.reset);
      log(`Title: ${data.content.title}`, colors.cyan);
      log(`Word Count: ${data.metrics.wordCount}`, colors.green);
      log(`Sources: ${data.content.sources}`, colors.green);
      log(`Originality: ${data.metrics.originalityScore}/100`, colors.green);
      log(`Credibility: ${data.metrics.credibilityScore}/100`, colors.green);
      log(`Infographics: ${data.content.infographics.length}`, colors.cyan);
      log(`Diagrams: ${data.content.diagrams.length}`, colors.cyan);
      log(`Cost: $${data.metrics.cost.toFixed(4)}`, colors.green);

    } else {
      log(`\n✗ White paper generation failed: ${data.error}`, colors.red);
    }

  } catch (error) {
    log(`\n✗ Request failed: ${error.message}`, colors.red);
  }

  log('\n========================================', colors.cyan);
  log('  Test Complete', colors.cyan + colors.bright);
  log('========================================\n', colors.cyan);
}

// Run tests
testContentGeneration().catch(error => {
  log(`\nUnexpected error: ${error.message}`, colors.red);
  console.error(error);
  process.exit(1);
});
