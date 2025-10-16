/**
 * Quick Fix Script: Bypass Authentication for /api/companies
 *
 * This script updates the companies API to work without authentication.
 * Use this if you want quick company creation without the full onboarding flow.
 *
 * USAGE:
 *   node scripts/fix-companies-auth.js
 *
 * WHAT IT DOES:
 *   - Updates app/api/companies/route.ts
 *   - Removes authentication requirement
 *   - Uses admin client to bypass RLS
 *   - Allows anyone to create companies
 *
 * SECURITY NOTE:
 *   This bypasses authentication. Only use if:
 *   - You're the only user
 *   - You don't care about multi-tenancy
 *   - You want quick company creation
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Companies API Authentication Fix\n');
console.log('This will modify app/api/companies/route.ts to bypass authentication.\n');

const routePath = path.join(__dirname, '../app/api/companies/route.ts');

if (!fs.existsSync(routePath)) {
  console.error('❌ Error: app/api/companies/route.ts not found');
  process.exit(1);
}

const currentContent = fs.readFileSync(routePath, 'utf8');

// Check if already bypassed
if (currentContent.includes('// AUTH BYPASSED')) {
  console.log('✅ Authentication already bypassed');
  console.log('   No changes needed.\n');
  process.exit(0);
}

// Create new POST function without auth
const newPostFunction = `// POST /api/companies - Create a new company (AUTH BYPASSED)
export async function POST(request: NextRequest) {
  try {
    // Use admin client to bypass RLS and authentication
    const supabase = createAdminClient();

    const body = await request.json();
    const validatedData = companySchema.parse(body);

    const { data, error } = await supabase
      .from('companies')
      .insert([{
        ...validatedData,
        // Default user_id and organisation_id (no auth required)
        user_id: '00000000-0000-0000-0000-000000000000',
        organisation_id: '00000000-0000-0000-0000-000000000000'
      }])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ company: data }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create company' },
      { status: 500 }
    );
  }
}`;

// Replace the old POST function
const updatedContent = currentContent.replace(
  /\/\/ POST \/api\/companies - Create a new company\nexport async function POST\(request: NextRequest\) \{[\s\S]*?^\}/m,
  newPostFunction
);

if (updatedContent === currentContent) {
  console.error('❌ Error: Could not find POST function to replace');
  console.error('   The file structure may have changed.');
  console.error('   Manual update required.\n');
  process.exit(1);
}

// Backup original file
const backupPath = routePath + '.backup';
fs.writeFileSync(backupPath, currentContent);
console.log('📦 Created backup:', backupPath);

// Write updated file
fs.writeFileSync(routePath, updatedContent);
console.log('✅ Updated:', routePath);

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('SUCCESS');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

console.log('Changes made:');
console.log('  ✅ Removed authentication requirement');
console.log('  ✅ Switched to admin client (bypasses RLS)');
console.log('  ✅ Added default user_id and organisation_id');
console.log('  ✅ Anyone can now create companies\n');

console.log('Next steps:');
console.log('  1. Restart your dev server (npm run dev)');
console.log('  2. Test at: http://localhost:3000/companies');
console.log('  3. Click "Create Campaign" and fill form');
console.log('  4. Company should be created successfully\n');

console.log('To deploy to production:');
console.log('  git add app/api/companies/route.ts');
console.log('  git commit -m "fix: Bypass authentication for company creation"');
console.log('  git push\n');

console.log('To undo this change:');
console.log('  cp app/api/companies/route.ts.backup app/api/companies/route.ts\n');

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
