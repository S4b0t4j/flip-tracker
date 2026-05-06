/**
 * Backfills latitude/longitude for any properties missing them.
 * Run after schema migration 001_add_geocoding.sql.
 *
 * Usage: npm run geocode
 */

import { createClient } from '@supabase/supabase-js';
import { geocodeAddress } from '../lib/geocode';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env');
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function run() {
  const { data: properties, error } = await admin
    .from('properties')
    .select('id, address, latitude, longitude')
    .or('latitude.is.null,longitude.is.null');

  if (error) {
    console.error(error);
    process.exit(1);
  }
  if (!properties || properties.length === 0) {
    console.log('Nothing to geocode. All properties have coordinates.');
    return;
  }

  console.log(`Geocoding ${properties.length} ${properties.length === 1 ? 'property' : 'properties'}...`);
  let success = 0;

  for (const p of properties) {
    const result = await geocodeAddress(p.address);
    if (result) {
      const { error: upErr } = await admin
        .from('properties')
        .update({ latitude: result.latitude, longitude: result.longitude })
        .eq('id', p.id);
      if (upErr) {
        console.log(`  ✗ ${p.address} → DB update failed: ${upErr.message}`);
      } else {
        console.log(`  ✓ ${p.address} → ${result.latitude}, ${result.longitude}`);
        success++;
      }
    } else {
      console.log(`  ✗ ${p.address} → no match`);
    }
    // Nominatim asks for max 1 req/sec
    await sleep(1200);
  }

  console.log(`\nDone. ${success} of ${properties.length} geocoded.`);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
