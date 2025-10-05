/**
 * Test DataForSEO Integration
 *
 * Run with: DATAFORSEO_API_KEY="login:password" npx tsx scripts/test-dataforseo.ts
 * Or ensure .env.local is loaded in your environment
 */

import axios from 'axios';

async function testDataForSEO() {
  console.log('🔍 Testing DataForSEO Integration\n');

  const apiKey = process.env.DATAFORSEO_API_KEY;

  if (!apiKey) {
    console.error('❌ DATAFORSEO_API_KEY not found in .env.local');
    process.exit(1);
  }

  console.log('✅ API Key found:', apiKey.split(':')[0] + ':***');

  const [login, password] = apiKey.split(':');

  if (!login || !password) {
    console.error('❌ Invalid API key format. Should be: login:password');
    process.exit(1);
  }

  console.log('✅ Credentials parsed successfully');
  console.log('   Login:', login);
  console.log('   Password:', password.substring(0, 4) + '***\n');

  // Test keyword: "water damage restoration services"
  const testKeyword = 'water damage restoration services';
  console.log(`🔎 Testing keyword: "${testKeyword}"\n`);

  try {
    const response = await axios.post(
      'https://api.dataforseo.com/v3/keywords_data/google_ads/search_volume/live',
      [{
        keywords: [testKeyword],
        location_code: 2840, // United States
        language_code: 'en',
      }],
      {
        auth: {
          username: login,
          password: password,
        },
        timeout: 15000,
      }
    );

    console.log('📊 API Response Status:', response.status);
    console.log('📊 Response Data:\n', JSON.stringify(response.data, null, 2));

    const task = response.data?.tasks?.[0];
    if (!task) {
      console.error('❌ No task found in response');
      return;
    }

    console.log('\n✅ Task Status:', task.status_message);
    console.log('✅ Cost:', task.cost);

    const result = task.result?.[0];
    if (!result) {
      console.error('❌ No result found in task');
      return;
    }

    console.log('\n📈 Keyword Data:');
    console.log('   Keyword:', result.keyword);
    console.log('   Search Volume:', result.search_volume);
    console.log('   CPC:', result.cpc);
    console.log('   Competition:', result.competition);
    console.log('   Competition Index:', result.competition_index);

    if (result.keyword_info) {
      console.log('   Difficulty:', result.keyword_info?.difficulty);
    }

    console.log('\n✅ DataForSEO integration is working correctly!');
    console.log(`✅ You have ${response.data.tasks_count} task(s) completed`);

  } catch (error: any) {
    console.error('\n❌ API Error:');
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Status Text:', error.response.statusText);
      console.error('   Data:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.error('   No response received');
      console.error('   Request:', error.message);
    } else {
      console.error('   Error:', error.message);
    }
    process.exit(1);
  }
}

testDataForSEO();
