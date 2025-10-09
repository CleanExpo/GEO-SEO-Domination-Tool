const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres.qwoggbbavikzhypzodcr:NwtXEg6aVNs7ZstH@aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

// Test with converted placeholders
const sql = 'SELECT id FROM saved_onboarding WHERE business_name = $1 AND email = $2';
const params = ['Test Business', 'test@example.com'];

console.log('🧪 Testing direct PostgreSQL connection');
console.log('📝 SQL:', sql);
console.log('📊 Params:', params);
console.log('');

pool.query(sql, params)
  .then(result => {
    console.log('✅ Query successful!');
    console.log('📊 Result:', result.rows);
    console.log('📈 Row count:', result.rowCount);
    pool.end();
  })
  .catch(err => {
    console.error('❌ Error:', err.message);
    console.error('📋 Code:', err.code);
    pool.end();
  });
