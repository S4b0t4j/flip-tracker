/**
 * Seed test data for the Flip Tracker.
 *
 * Usage:
 *   1. Copy .env.example -> .env.local and fill in the SERVICE ROLE KEY
 *   2. Run: npm run seed
 *
 * Creates a test account (test@example.com / password123) with three properties
 * at different stages and pre-populated expenses, contractors, photos, milestones.
 *
 * SAFE TO RUN MULTIPLE TIMES: deletes any existing data for the test user first.
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env');
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const TEST_EMAIL = 'test@example.com';
const TEST_PASSWORD = 'password123';

async function ensureUser(): Promise<string> {
  // Try to find existing user
  const { data: list } = await admin.auth.admin.listUsers();
  const existing = list?.users.find((u) => u.email === TEST_EMAIL);
  if (existing) {
    console.log(`Found existing test user: ${existing.id}`);
    return existing.id;
  }
  // Create
  const { data, error } = await admin.auth.admin.createUser({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: 'Test Flipper' },
  });
  if (error) throw error;
  console.log(`Created test user: ${data.user.id}`);
  return data.user.id;
}

async function clearExistingData(userId: string) {
  const { data: props } = await admin.from('properties').select('id').eq('user_id', userId);
  const ids = (props || []).map((p) => p.id);
  if (ids.length === 0) return;
  // Cascading deletes will handle children
  await admin.from('properties').delete().in('id', ids);
  console.log(`Cleared ${ids.length} existing test properties`);
}

async function seed() {
  const userId = await ensureUser();
  await clearExistingData(userId);

  // Property 1 - In Renovation, on track
  const { data: p1, error: e1 } = await admin.from('properties').insert({
    user_id: userId,
    address: '123 Main St, Atlanta, GA',
    purchase_price: 85000,
    estimated_arv: 180000,
    acquisition_date: '2026-02-15',
    target_reno_completion: '2026-06-15',
    target_sale_date: '2026-08-01',
    current_stage: 'In Renovation',
    notes: 'Solid 1950s ranch. Major systems updated. Kitchen and bath remodel underway.',
  }).select().single();
  if (e1) throw e1;

  // Property 2 - Listed, tight margin
  const { data: p2, error: e2 } = await admin.from('properties').insert({
    user_id: userId,
    address: '456 Oak Ave, Atlanta, GA',
    purchase_price: 120000,
    estimated_arv: 240000,
    acquisition_date: '2025-10-01',
    target_reno_completion: '2026-03-01',
    target_sale_date: '2026-05-15',
    current_stage: 'Listed',
    notes: 'Renovation complete. On MLS at $239k. Tight budget — watch holding costs.',
  }).select().single();
  if (e2) throw e2;

  // Property 3 - Sourcing, no purchase yet
  const { data: p3, error: e3 } = await admin.from('properties').insert({
    user_id: userId,
    address: '789 Pine Ln, Atlanta, GA',
    estimated_arv: 180000,
    current_stage: 'Sourcing',
    notes: 'Reviewing inspection report. Roof and foundation concerns. Need contractor walk-through.',
  }).select().single();
  if (e3) throw e3;

  console.log(`Created 3 properties: ${p1.address}, ${p2.address}, ${p3.address}`);

  // Default budgets are auto-created via app, but we'll seed manually here
  const categories = [
    'Demo', 'Plumbing', 'Electrical', 'HVAC', 'Drywall', 'Flooring', 'Paint',
    'Kitchen', 'Bathrooms', 'Roof', 'Holding Costs', 'Permits', 'Contingency',
  ];

  // P1 budgets
  await admin.from('rehab_budgets').insert([
    { property_id: p1.id, category: 'Demo', budgeted_amount: 3000 },
    { property_id: p1.id, category: 'Plumbing', budgeted_amount: 8000 },
    { property_id: p1.id, category: 'Electrical', budgeted_amount: 6500 },
    { property_id: p1.id, category: 'HVAC', budgeted_amount: 7000 },
    { property_id: p1.id, category: 'Drywall', budgeted_amount: 4500 },
    { property_id: p1.id, category: 'Flooring', budgeted_amount: 9000 },
    { property_id: p1.id, category: 'Paint', budgeted_amount: 4000 },
    { property_id: p1.id, category: 'Kitchen', budgeted_amount: 18000 },
    { property_id: p1.id, category: 'Bathrooms', budgeted_amount: 9000 },
    { property_id: p1.id, category: 'Holding Costs', budgeted_amount: 2000 },
  ]);

  // P2 budgets (tight)
  await admin.from('rehab_budgets').insert([
    { property_id: p2.id, category: 'Demo', budgeted_amount: 5000 },
    { property_id: p2.id, category: 'Plumbing', budgeted_amount: 12000 },
    { property_id: p2.id, category: 'Electrical', budgeted_amount: 9000 },
    { property_id: p2.id, category: 'HVAC', budgeted_amount: 10000 },
    { property_id: p2.id, category: 'Kitchen', budgeted_amount: 28000 },
    { property_id: p2.id, category: 'Bathrooms', budgeted_amount: 16000 },
    { property_id: p2.id, category: 'Flooring', budgeted_amount: 14000 },
    { property_id: p2.id, category: 'Paint', budgeted_amount: 6000 },
    { property_id: p2.id, category: 'Roof', budgeted_amount: 8000 },
    { property_id: p2.id, category: 'Holding Costs', budgeted_amount: 2000 },
  ]);

  // Contractors for P1
  const { data: c1a } = await admin.from('contractors').insert({
    property_id: p1.id, name: "John's Carpentry", phone: '404-555-0101',
    email: 'john@carpentry.com', scope_of_work: 'Framing, trim, kitchen cabinets',
    cost_rate: 8500, cost_type: 'Fixed', start_date: '2026-03-01', end_date: '2026-04-15',
  }).select().single();
  const { data: c1b } = await admin.from('contractors').insert({
    property_id: p1.id, name: "Mike's Hazmat", phone: '404-555-0102',
    scope_of_work: 'Asbestos removal, lead paint abatement',
    cost_rate: 4200, cost_type: 'Fixed', start_date: '2026-02-20', end_date: '2026-02-28',
  }).select().single();
  const { data: c1c } = await admin.from('contractors').insert({
    property_id: p1.id, name: 'Elite Electric', phone: '404-555-0103',
    email: 'dispatch@eliteelectric.com', scope_of_work: 'Service panel, full rewire',
    cost_rate: 6500, cost_type: 'Fixed', start_date: '2026-03-10', end_date: '2026-03-25',
  }).select().single();

  // Contractor for P2
  const { data: c2a } = await admin.from('contractors').insert({
    property_id: p2.id, name: 'Elite Renovations', phone: '404-555-0201',
    scope_of_work: 'Full gut renovation - GC',
    cost_rate: 95000, cost_type: 'Fixed', start_date: '2025-11-01', end_date: '2026-02-20',
  }).select().single();

  // Expenses for P1 ($42,700 spent)
  await admin.from('expenses').insert([
    { property_id: p1.id, category: 'Demo', amount: 2800, description: 'Demo and haul', date_incurred: '2026-02-20' },
    { property_id: p1.id, category: 'Plumbing', amount: 7200, description: 'Rough plumbing', date_incurred: '2026-03-05' },
    { property_id: p1.id, category: 'Electrical', amount: 6500, description: 'Full rewire', contractor_id: c1c?.id, date_incurred: '2026-03-22' },
    { property_id: p1.id, category: 'HVAC', amount: 6800, description: 'New system + ductwork', date_incurred: '2026-03-28' },
    { property_id: p1.id, category: 'Drywall', amount: 4100, description: 'Hang and finish', date_incurred: '2026-04-05' },
    { property_id: p1.id, category: 'Other', amount: 4200, description: 'Hazmat abatement', contractor_id: c1b?.id, date_incurred: '2026-02-25' },
    { property_id: p1.id, category: 'Other', amount: 8500, description: 'Framing + trim', contractor_id: c1a?.id, date_incurred: '2026-04-15' },
    { property_id: p1.id, category: 'Permits', amount: 1200, description: 'Building + electrical permits', date_incurred: '2026-02-18' },
    { property_id: p1.id, category: 'Holding Costs', amount: 1400, description: 'Property tax + insurance', date_incurred: '2026-03-01' },
  ]);

  // Expenses for P2 ($109,800 spent — tight!)
  await admin.from('expenses').insert([
    { property_id: p2.id, category: 'Other', amount: 95000, description: 'GC contract - Elite Renovations', contractor_id: c2a?.id, date_incurred: '2026-02-20' },
    { property_id: p2.id, category: 'Holding Costs', amount: 8200, description: '5 months tax/insurance/utilities', date_incurred: '2026-03-01' },
    { property_id: p2.id, category: 'Permits', amount: 2100, description: 'All permits', date_incurred: '2025-10-15' },
    { property_id: p2.id, category: 'Other', amount: 4500, description: 'Staging', date_incurred: '2026-03-10' },
  ]);

  // Milestones P1
  await admin.from('milestones').insert([
    { property_id: p1.id, milestone_type: 'Acquisition', target_date: '2026-02-15', actual_date: '2026-02-15' },
    { property_id: p1.id, milestone_type: 'Inspection', target_date: '2026-02-12', actual_date: '2026-02-12' },
    { property_id: p1.id, milestone_type: 'Permitting', target_date: '2026-02-20', actual_date: '2026-02-18' },
    { property_id: p1.id, milestone_type: 'Construction Start', target_date: '2026-02-25', actual_date: '2026-02-22' },
    { property_id: p1.id, milestone_type: 'Construction End', target_date: '2026-06-15', actual_date: null },
    { property_id: p1.id, milestone_type: 'Staging', target_date: '2026-06-25', actual_date: null },
    { property_id: p1.id, milestone_type: 'List Date', target_date: '2026-07-01', actual_date: null },
  ]);

  // Milestones P2 (mostly complete, listed)
  await admin.from('milestones').insert([
    { property_id: p2.id, milestone_type: 'Acquisition', target_date: '2025-10-01', actual_date: '2025-10-01' },
    { property_id: p2.id, milestone_type: 'Permitting', target_date: '2025-10-20', actual_date: '2025-10-15' },
    { property_id: p2.id, milestone_type: 'Construction Start', target_date: '2025-11-01', actual_date: '2025-11-01' },
    { property_id: p2.id, milestone_type: 'Construction End', target_date: '2026-03-01', actual_date: '2026-02-28' },
    { property_id: p2.id, milestone_type: 'List Date', target_date: '2026-03-15', actual_date: '2026-03-12' },
    { property_id: p2.id, milestone_type: 'Offer Received', target_date: '2026-04-15', actual_date: null },
  ]);

  // Milestones P3 (sourcing)
  await admin.from('milestones').insert([
    { property_id: p3.id, milestone_type: 'Inspection', target_date: '2026-05-20', actual_date: null },
  ]);

  console.log('Seed complete.');
  console.log(`Sign in: ${TEST_EMAIL} / ${TEST_PASSWORD}`);
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
