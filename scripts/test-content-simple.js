#!/usr/bin/env node

/**
 * Simple Content Generation Test
 * Tests one quick social post to verify database saves work
 */

const API_URL = 'http://localhost:3001/api/crm/content/generate';

async function testSimpleGeneration() {
  console.log('\n🎨 Testing Content Generation with Database Save...\n');

  const request = {
    type: 'social_post',
    topic: 'Fire Safety Tips',
    industry: 'Disaster Recovery',
    platform: 'linkedin',
    tone: 'professional',
    includeImages: false, // Skip image to speed up test
    saveToDatabase: true
  };

  try {
    console.log('📤 Sending request...');
    const startTime = Date.now();

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request)
    });

    const data = await response.json();
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    if (data.success) {
      console.log(`\n✅ SUCCESS in ${duration}s!\n`);
      console.log(`📝 Title: ${data.content.title}`);
      console.log(`💾 Content ID: ${data.contentId || 'Not saved'}`);
      console.log(`📊 Word Count: ${data.metrics.wordCount}`);
      console.log(`🎯 SEO Score: ${data.metrics.seoScore}/100`);
      console.log(`📖 Readability: ${data.metrics.readabilityScore}/100`);
      console.log(`💰 Cost: $${data.metrics.cost.toFixed(4)}`);
      console.log(`\n✨ Database save: ${data.contentId ? 'SUCCESS ✅' : 'FAILED ❌'}`);
    } else {
      console.log(`\n❌ FAILED: ${data.error}`);
      if (data.details) console.log(data.details);
    }

  } catch (error) {
    console.log(`\n❌ Request failed: ${error.message}`);
  }
}

testSimpleGeneration();
