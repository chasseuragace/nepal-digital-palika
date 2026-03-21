# Seeding Scripts Specification

**Purpose:** Define the seeding scripts needed for configurable user and business seeding  
**Date:** 2026-03-21  
**Status:** 🔵 Specification Ready

---

## Overview

Three new seeding scripts are needed to support configurable testing:

1. **seed-users-configurable.ts** - Seed n users to m palikas
2. **configure-palika.ts** - Configure palika tier and categories
3. **verify-palika-setup.ts** - Verify palika setup is complete

---

## Script 1: seed-users-configurable.ts

### Purpose
Seed a configurable number of users to a list of palikas, with auto-created business profiles

### Usage
```bash
npm run seed:users -- --count=10 --palikas=kathmandu,bhaktapur,lalitpur
npm run seed:users -- --count=5 --palikas=kathmandu
```

### Parameters
- `--count` (required): Number of users per palika
- `--palikas` (required): Comma-separated list of palika IDs
- `--tier` (optional): Filter palikas by tier (Basic, Tourism, Premium)

### Implementation

```typescript
// database/scripts/seed-users-configurable.ts

import { createClient } from '@supabase/supabase-js';
import { faker } from '@faker-js/faker';

interface SeedOptions {
  count: number;
  palikas: string[];
  tier?: 'Basic' | 'Tourism' | 'Premium';
}

async function seedUsersConfigurable() {
  // Parse command line arguments
  const args = process.argv.slice(2);
  const options = parseArgs(args);

  // Validate options
  if (!options.count || !options.palikas.length) {
    console.error('Usage: npm run seed:users -- --count=10 --palikas=kathmandu,bhaktapur');
    process.exit(1);
  }

  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    // 1. Validate palikas exist
    const { data: palikas, error: palikaError } = await supabase
      .from('palikas')
      .select('id, name, subscription_tier')
      .in('id', options.palikas);

    if (palikaError || !palikas?.length) {
      console.error('Error: Some palikas not found');
      process.exit(1);
    }

    console.log(`Found ${palikas.length} palikas`);

    // 2. For each palika, seed users
    let totalUsersCreated = 0;
    let totalBusinessesCreated = 0;

    for (const palika of palikas) {
      console.log(`\nSeeding ${options.count} users to ${palika.name}...`);

      // Create users
      const users = [];
      for (let i = 0; i < options.count; i++) {
        const email = faker.internet.email();
        const password = faker.internet.password();

        // Create auth user
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
        });

        if (authError) {
          console.error(`Error creating auth user: ${authError.message}`);
          continue;
        }

        // Create user record
        const { data: userData, error: userError } = await supabase
          .from('users')
          .insert({
            id: authData.user.id,
            email,
            palika_id: palika.id,
            name: faker.person.fullName(),
            phone: faker.phone.number(),
          })
          .select()
          .single();

        if (userError) {
          console.error(`Error creating user record: ${userError.message}`);
          continue;
        }

        users.push(userData);
        totalUsersCreated++;

        // Auto-create business profile
        const { data: businessData, error: businessError } = await supabase
          .from('businesses')
          .insert({
            user_id: userData.id,
            palika_id: palika.id,
            name: faker.company.name(),
            description: faker.company.catchPhrase(),
            phone: faker.phone.number(),
            email: faker.internet.email(),
            address: faker.location.streetAddress(),
            status: 'active',
            verification_status: 'pending',
          })
          .select()
          .single();

        if (businessError) {
          console.error(`Error creating business: ${businessError.message}`);
          continue;
        }

        totalBusinessesCreated++;
        console.log(`  ✓ User ${i + 1}/${options.count}: ${email}`);
      }
    }

    console.log(`\n✅ Seeding complete!`);
    console.log(`   Users created: ${totalUsersCreated}`);
    console.log(`   Businesses created: ${totalBusinessesCreated}`);

  } catch (error) {
    console.error('Error during seeding:', error);
    process.exit(1);
  }
}

function parseArgs(args: string[]): SeedOptions {
  const options: SeedOptions = {
    count: 0,
    palikas: [],
  };

  for (const arg of args) {
    if (arg.startsWith('--count=')) {
      options.count = parseInt(arg.split('=')[1]);
    } else if (arg.startsWith('--palikas=')) {
      options.palikas = arg.split('=')[1].split(',');
    } else if (arg.startsWith('--tier=')) {
      options.tier = arg.split('=')[1] as any;
    }
  }

  return options;
}

seedUsersConfigurable();
```

### Output
```
Found 3 palikas

Seeding 10 users to Kathmandu Metropolitan...
  ✓ User 1/10: john@example.com
  ✓ User 2/10: jane@example.com
  ...
  ✓ User 10/10: bob@example.com

Seeding 10 users to Bhaktapur...
  ✓ User 1/10: alice@example.com
  ...

✅ Seeding complete!
   Users created: 30
   Businesses created: 30
```

---

## Script 2: configure-palika.ts

### Purpose
Configure a palika's tier and enable marketplace categories based on tier

### Usage
```bash
npm run configure:palika -- --palika=kathmandu --tier=Premium
npm run configure:palika -- --palika=bhaktapur --tier=Tourism
```

### Parameters
- `--palika` (required): Palika ID
- `--tier` (required): Subscription tier (Basic, Tourism, Premium)

### Implementation

```typescript
// database/scripts/configure-palika.ts

import { createClient } from '@supabase/supabase-js';

interface ConfigOptions {
  palika: string;
  tier: 'Basic' | 'Tourism' | 'Premium';
}

async function configurePalika() {
  const args = process.argv.slice(2);
  const options = parseArgs(args);

  if (!options.palika || !options.tier) {
    console.error('Usage: npm run configure:palika -- --palika=kathmandu --tier=Premium');
    process.exit(1);
  }

  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    // 1. Verify palika exists
    const { data: palika, error: palikaError } = await supabase
      .from('palikas')
      .select('id, name, subscription_tier')
      .eq('id', options.palika)
      .single();

    if (palikaError || !palika) {
      console.error(`Error: Palika '${options.palika}' not found`);
      process.exit(1);
    }

    console.log(`Found palika: ${palika.name}`);
    console.log(`Current tier: ${palika.subscription_tier}`);
    console.log(`New tier: ${options.tier}`);

    // 2. Update palika tier
    const { error: updateError } = await supabase
      .from('palikas')
      .update({ subscription_tier: options.tier })
      .eq('id', options.palika);

    if (updateError) {
      console.error(`Error updating tier: ${updateError.message}`);
      process.exit(1);
    }

    console.log(`✓ Tier updated to ${options.tier}`);

    // 3. Enable categories based on tier
    const categories = getCategoriesByTier(options.tier);
    
    for (const category of categories) {
      const { error: categoryError } = await supabase
        .from('marketplace_categories')
        .insert({
          palika_id: options.palika,
          name: category.name,
          description: category.description,
          tier: options.tier,
          enabled: true,
        })
        .on('CONFLICT', (conflict) => conflict.ignore());

      if (categoryError && !categoryError.message.includes('duplicate')) {
        console.error(`Error enabling category ${category.name}: ${categoryError.message}`);
      }
    }

    console.log(`✓ Enabled ${categories.length} categories for ${options.tier} tier`);

    console.log(`\n✅ Configuration complete!`);

  } catch (error) {
    console.error('Error during configuration:', error);
    process.exit(1);
  }
}

function getCategoriesByTier(tier: string): Array<{ name: string; description: string }> {
  const allCategories = [
    { name: 'Handicrafts', description: 'Local handicrafts and artisan products' },
    { name: 'Textiles', description: 'Traditional textiles and fabrics' },
    { name: 'Food & Beverages', description: 'Local food and beverage products' },
    { name: 'Tourism Services', description: 'Tourism-related services' },
    { name: 'Accommodation', description: 'Hotels and lodging services' },
    { name: 'Transportation', description: 'Transportation and travel services' },
  ];

  const tierCategories = {
    'Basic': allCategories.slice(0, 2),      // Handicrafts, Textiles
    'Tourism': allCategories.slice(0, 4),    // + Food, Tourism Services
    'Premium': allCategories,                 // All categories
  };

  return tierCategories[tier] || [];
}

function parseArgs(args: string[]): ConfigOptions {
  const options: ConfigOptions = {
    palika: '',
    tier: 'Basic',
  };

  for (const arg of args) {
    if (arg.startsWith('--palika=')) {
      options.palika = arg.split('=')[1];
    } else if (arg.startsWith('--tier=')) {
      options.tier = arg.split('=')[1] as any;
    }
  }

  return options;
}

configurePalika();
```

### Output
```
Found palika: Kathmandu Metropolitan
Current tier: Basic
New tier: Premium

✓ Tier updated to Premium
✓ Enabled 6 categories for Premium tier

✅ Configuration complete!
```

---

## Script 3: verify-palika-setup.ts

### Purpose
Verify that a palika is properly set up for testing

### Usage
```bash
npm run verify:palika -- --palika=kathmandu
npm run verify:palika -- --palika=bhaktapur --verbose
```

### Parameters
- `--palika` (required): Palika ID
- `--verbose` (optional): Show detailed information

### Implementation

```typescript
// database/scripts/verify-palika-setup.ts

import { createClient } from '@supabase/supabase-js';

interface VerifyOptions {
  palika: string;
  verbose?: boolean;
}

async function verifyPalikaSetup() {
  const args = process.argv.slice(2);
  const options = parseArgs(args);

  if (!options.palika) {
    console.error('Usage: npm run verify:palika -- --palika=kathmandu');
    process.exit(1);
  }

  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    console.log(`\nVerifying setup for palika: ${options.palika}\n`);

    let allGood = true;

    // 1. Check palika exists
    const { data: palika, error: palikaError } = await supabase
      .from('palikas')
      .select('id, name, subscription_tier')
      .eq('id', options.palika)
      .single();

    if (palikaError || !palika) {
      console.log('❌ Palika not found');
      allGood = false;
    } else {
      console.log(`✓ Palika found: ${palika.name}`);
      console.log(`  Tier: ${palika.subscription_tier}`);
    }

    // 2. Check tier assigned
    if (palika && !palika.subscription_tier) {
      console.log('❌ Tier not assigned');
      allGood = false;
    } else if (palika) {
      console.log(`✓ Tier assigned: ${palika.subscription_tier}`);
    }

    // 3. Check categories enabled
    const { data: categories, error: categoryError } = await supabase
      .from('marketplace_categories')
      .select('name, tier')
      .eq('palika_id', options.palika);

    if (categoryError) {
      console.log('❌ Error checking categories');
      allGood = false;
    } else if (!categories?.length) {
      console.log('⚠️  No categories enabled');
    } else {
      console.log(`✓ Categories enabled: ${categories.length}`);
      if (options.verbose) {
        categories.forEach(cat => console.log(`    - ${cat.name}`));
      }
    }

    // 4. Check users exist
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('palika_id', options.palika);

    if (userError) {
      console.log('❌ Error checking users');
      allGood = false;
    } else if (!users?.length) {
      console.log('⚠️  No users seeded');
    } else {
      console.log(`✓ Users seeded: ${users.length}`);
    }

    // 5. Check business profiles exist
    const { data: businesses, error: businessError } = await supabase
      .from('businesses')
      .select('id')
      .eq('palika_id', options.palika);

    if (businessError) {
      console.log('❌ Error checking businesses');
      allGood = false;
    } else if (!businesses?.length) {
      console.log('⚠️  No business profiles created');
    } else {
      console.log(`✓ Business profiles: ${businesses.length}`);
    }

    // 6. Check products exist
    const { data: products, error: productError } = await supabase
      .from('products')
      .select('id')
      .eq('palika_id', options.palika);

    if (productError) {
      console.log('❌ Error checking products');
      allGood = false;
    } else if (!products?.length) {
      console.log('⚠️  No products created');
    } else {
      console.log(`✓ Products: ${products.length}`);
    }

    // Summary
    console.log('\n' + '='.repeat(50));
    if (allGood) {
      console.log('✅ Setup verification complete - All checks passed!');
    } else {
      console.log('⚠️  Setup verification complete - Some issues found');
    }
    console.log('='.repeat(50) + '\n');

  } catch (error) {
    console.error('Error during verification:', error);
    process.exit(1);
  }
}

function parseArgs(args: string[]): VerifyOptions {
  const options: VerifyOptions = {
    palika: '',
    verbose: false,
  };

  for (const arg of args) {
    if (arg.startsWith('--palika=')) {
      options.palika = arg.split('=')[1];
    } else if (arg === '--verbose') {
      options.verbose = true;
    }
  }

  return options;
}

verifyPalikaSetup();
```

### Output
```
Verifying setup for palika: kathmandu

✓ Palika found: Kathmandu Metropolitan
  Tier: Premium
✓ Tier assigned: Premium
✓ Categories enabled: 6
✓ Users seeded: 10
✓ Business profiles: 10
✓ Products: 25

==================================================
✅ Setup verification complete - All checks passed!
==================================================
```

---

## Package.json Scripts

Add these scripts to `database/package.json`:

```json
{
  "scripts": {
    "seed:users": "ts-node scripts/seed-users-configurable.ts",
    "configure:palika": "ts-node scripts/configure-palika.ts",
    "verify:palika": "ts-node scripts/verify-palika-setup.ts"
  }
}
```

---

## Dependencies

These scripts require:
- `@supabase/supabase-js` - Already installed
- `@faker-js/faker` - For generating fake data
- `ts-node` - For running TypeScript

Install if needed:
```bash
cd database
npm install @faker-js/faker
npm install -D ts-node
```

---

## Testing the Scripts

### Test 1: Configure Palika
```bash
cd database
npm run configure:palika -- --palika=kathmandu --tier=Premium
```

### Test 2: Seed Users
```bash
cd database
npm run seed:users -- --count=10 --palikas=kathmandu,bhaktapur
```

### Test 3: Verify Setup
```bash
cd database
npm run verify:palika -- --palika=kathmandu --verbose
```

---

## Integration with m-place

### Environment Variables
```bash
# m-place/.env.local
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=[anon-key]
VITE_PALIKA_ID=kathmandu
```

### Launch m-place
```bash
cd m-place
npm run dev
```

### Expected Behavior
- m-place connects to Supabase
- Shows only data for specified palika
- Categories based on palika's tier
- Users can browse products
- Users can create new products

---

## Next Steps

1. Implement seed-users-configurable.ts
2. Implement configure-palika.ts
3. Implement verify-palika-setup.ts
4. Add scripts to package.json
5. Test each script individually
6. Test complete flow
7. Document findings
8. Prepare for Phase 6

---

**Specification Created:** 2026-03-21  
**Status:** 🔵 Ready for Implementation
