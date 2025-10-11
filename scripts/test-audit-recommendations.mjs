import fetch from 'node-fetch';

const response = await fetch('https://geo-seo-domination-tool.vercel.app/api/seo-audits', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({url: 'https://www.carsi.com.au'})
});

const data = await response.json();

console.log('\n📊 AUDIT RESPONSE:');
console.log('Status:', data.audit ? 'SUCCESS' : 'FAILED');
console.log('Title:', data.audit?.metadata?.title);
console.log('Issues:', data.audit?.issues?.length || 0);

if (data.audit?.recommendations) {
  console.log('\n✅ Recommendations found:', data.audit.recommendations.length);
  data.audit.recommendations.forEach((r, i) => {
    console.log(`  ${i+1}. ${r}`);
  });
} else {
  console.log('\n❌ No recommendations in response');
  console.log('Metadata keys:', Object.keys(data.audit?.metadata || {}));
}
