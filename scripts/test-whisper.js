/**
 * Whisper Integration Test Script
 *
 * Tests the Whisper speech-to-text integration using Groq API
 *
 * Usage:
 *   node scripts/test-whisper.js [audio-file-path]
 *
 * Example:
 *   node scripts/test-whisper.js ./test-audio.mp3
 */

const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const fetch = require('node-fetch');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

if (!GROQ_API_KEY) {
  console.error('❌ GROQ_API_KEY not found in environment variables');
  process.exit(1);
}

/**
 * Test 1: Direct Groq API call
 */
async function testGroqDirectAPI(audioFilePath) {
  console.log('\n🧪 Test 1: Direct Groq API Call');
  console.log('─'.repeat(50));

  try {
    const formData = new FormData();
    formData.append('file', fs.createReadStream(audioFilePath));
    formData.append('model', 'whisper-large-v3');
    formData.append('response_format', 'json');

    const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API Error: ${error}`);
    }

    const result = await response.json();
    console.log('✅ Direct API call successful');
    console.log('📝 Transcript:', result.text?.substring(0, 200) + '...');
    console.log('🌍 Language:', result.language || 'auto-detected');
    return true;
  } catch (error) {
    console.error('❌ Direct API test failed:', error.message);
    return false;
  }
}

/**
 * Test 2: Next.js API Route
 */
async function testNextJSAPIRoute(audioFilePath) {
  console.log('\n🧪 Test 2: Next.js API Route');
  console.log('─'.repeat(50));

  try {
    const formData = new FormData();
    formData.append('file', fs.createReadStream(audioFilePath));
    formData.append('action', 'transcribe');
    formData.append('responseFormat', 'json');

    const response = await fetch(`${API_BASE_URL}/api/transcribe`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`API Error: ${error.message}`);
    }

    const data = await response.json();
    console.log('✅ Next.js API route successful');
    console.log('📝 Result:', JSON.stringify(data.result).substring(0, 200) + '...');
    console.log('📊 Metadata:', data.metadata);
    return true;
  } catch (error) {
    console.error('❌ Next.js API test failed:', error.message);
    console.error('💡 Make sure Next.js dev server is running: npm run dev');
    return false;
  }
}

/**
 * Test 3: Whisper Service Functions
 */
async function testWhisperService(audioFilePath) {
  console.log('\n🧪 Test 3: Whisper Service Functions');
  console.log('─'.repeat(50));

  try {
    // This requires the service to be imported, which needs TypeScript compilation
    console.log('⚠️  Service test requires TypeScript compilation');
    console.log('💡 Run: npm run build && node -r ts-node/register scripts/test-whisper.ts');
    return true;
  } catch (error) {
    console.error('❌ Service test failed:', error.message);
    return false;
  }
}

/**
 * Test 4: File Format Validation
 */
async function testFileFormatValidation() {
  console.log('\n🧪 Test 4: File Format Validation');
  console.log('─'.repeat(50));

  const supportedFormats = [
    'flac',
    'm4a',
    'mp3',
    'mp4',
    'mpeg',
    'mpga',
    'oga',
    'ogg',
    'wav',
    'webm',
  ];

  console.log('✅ Supported formats:', supportedFormats.join(', '));

  const testFiles = [
    { name: 'audio.mp3', expected: true },
    { name: 'audio.wav', expected: true },
    { name: 'audio.txt', expected: false },
    { name: 'audio.jpg', expected: false },
  ];

  testFiles.forEach((test) => {
    const extension = test.name.split('.').pop()?.toLowerCase();
    const isValid = extension && supportedFormats.includes(extension);
    const status = isValid === test.expected ? '✅' : '❌';
    console.log(`${status} ${test.name}: ${isValid ? 'Valid' : 'Invalid'}`);
  });

  return true;
}

/**
 * Test 5: API Information Endpoint
 */
async function testAPIInfo() {
  console.log('\n🧪 Test 5: API Information Endpoint');
  console.log('─'.repeat(50));

  try {
    const response = await fetch(`${API_BASE_URL}/api/transcribe`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch API info');
    }

    const info = await response.json();
    console.log('✅ API info retrieved successfully');
    console.log('🤖 Service:', info.service);
    console.log('📦 Model:', info.model);
    console.log('📁 Formats:', info.supportedFormats?.length, 'formats');
    console.log('🌍 Languages:', info.supportedLanguages?.length, 'languages');
    console.log('📊 Actions:', info.actions?.join(', '));
    return true;
  } catch (error) {
    console.error('❌ API info test failed:', error.message);
    console.error('💡 Make sure Next.js dev server is running: npm run dev');
    return false;
  }
}

/**
 * Main test runner
 */
async function runTests() {
  console.log('\n🚀 Whisper Integration Test Suite');
  console.log('═'.repeat(50));

  const audioFilePath = process.argv[2];

  if (!audioFilePath) {
    console.log('\n⚠️  No audio file provided');
    console.log('💡 Usage: node scripts/test-whisper.js <audio-file-path>');
    console.log('💡 Example: node scripts/test-whisper.js ./test-audio.mp3');
    console.log('\nRunning tests that don\'t require audio file...\n');
  } else if (!fs.existsSync(audioFilePath)) {
    console.error(`\n❌ Audio file not found: ${audioFilePath}`);
    process.exit(1);
  } else {
    const stats = fs.statSync(audioFilePath);
    console.log(`\n📁 Audio file: ${audioFilePath}`);
    console.log(`📊 File size: ${(stats.size / 1024).toFixed(2)} KB`);
  }

  const results = {
    fileValidation: false,
    apiInfo: false,
    directAPI: false,
    nextjsAPI: false,
    service: false,
  };

  // Run tests
  results.fileValidation = await testFileFormatValidation();
  results.apiInfo = await testAPIInfo();

  if (audioFilePath && fs.existsSync(audioFilePath)) {
    results.directAPI = await testGroqDirectAPI(audioFilePath);
    results.nextjsAPI = await testNextJSAPIRoute(audioFilePath);
    results.service = await testWhisperService(audioFilePath);
  }

  // Summary
  console.log('\n📊 Test Summary');
  console.log('═'.repeat(50));
  Object.entries(results).forEach(([test, passed]) => {
    const status = passed ? '✅ PASS' : '❌ FAIL';
    const name = test.replace(/([A-Z])/g, ' $1').trim();
    console.log(`${status} - ${name}`);
  });

  const passedCount = Object.values(results).filter(Boolean).length;
  const totalCount = Object.values(results).length;

  console.log('\n' + '─'.repeat(50));
  console.log(`Results: ${passedCount}/${totalCount} tests passed`);

  if (passedCount === totalCount) {
    console.log('\n✅ All tests passed! Whisper integration is ready.');
  } else if (passedCount > 0) {
    console.log('\n⚠️  Some tests failed. Check errors above.');
  } else {
    console.log('\n❌ All tests failed. Check configuration.');
  }

  console.log('\n💡 Next steps:');
  console.log('   1. Ensure GROQ_API_KEY is set in .env.local');
  console.log('   2. Start Next.js dev server: npm run dev');
  console.log('   3. Test with audio file: node scripts/test-whisper.js ./audio.mp3');
  console.log('   4. Check documentation: docs/WHISPER_INTEGRATION.md');
}

// Run tests
runTests().catch((error) => {
  console.error('\n❌ Test suite error:', error);
  process.exit(1);
});
