// Database types - mirrors supabase/schema.sql

export type Stage =
  | 'Sourcing'
  | 'Under Contract'
  | 'Acquired'
  | 'Pre-Renovation'
  | 'In Renovation'
  | 'Hold/Staging'
  | 'Listed'
  | 'Sold'
  | 'Closed'
  | 'Failed';

export const STAGES: Stage[] = [
  'Sourcing',
  'Under Contract',
  'Acquired',
  'Pre-Renovation',
  'In Renovation',
  'Hold/Staging',
  'Listed',
  'Sold',
  'Closed',
  'Failed',
];

export const DEFAULT_BUDGET_CATEGORIES = [
  'Demo',
  'Framing',
  'Plumbing',
  'Electrical',
  'HVAC',
  'Drywall',
  'Flooring',
  'Paint',
  'Kitchen',
  'Bathrooms',
  'Roof',
  'Windows',
  'Exterior',
  'Landscaping',
  'Permits',
  'Holding Costs',
  'Contingency',
  'Other',
] as const;

export const MILESTONE_TYPES = [
  'Acquisition',
  'Inspection',
  'Permitting',
  'Construction Start',
  'Construction End',
  'Staging',
  'List Date',
  'Offer Received',
  'Close',
] as const;

export interface Property {
  id: string;
  user_id: string;
  address: string;
  zillow_link: string | null;
  purchase_price: number | null;
  acquisition_date: string | null;
  estimated_arv: number | null;
  current_stage: Stage;
  target_reno_completion: string | null;
  target_sale_date: string | null;
  notes: string | null;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
  updated_at: string;
}

export interface RehabBudget {
  id: string;
  property_id: string;
  category: string;
  budgeted_amount: number;
  notes: string | null;
  created_at: string;
}

export interface Expense {
  id: string;
  property_id: string;
  category: string;
  amount: number;
  description: string | null;
  contractor_id: string | null;
  receipt_image_url: string | null;
  date_incurred: string;
  created_at: string;
}

export interface Contractor {
  id: string;
  property_id: string;
  name: string;
  phone: string | null;
  email: string | null;
  scope_of_work: string | null;
  cost_rate: number | null;
  cost_type: string;
  start_date: string | null;
  end_date: string | null;
  notes: string | null;
  created_at: string;
}

export interface Photo {
  id: string;
  property_id: string;
  image_url: string;
  caption: string | null;
  status_at_time: string | null;
  uploaded_at: string;
}

export interface StatusLog {
  id: string;
  property_id: string;
  old_stage: string | null;
  new_stage: string | null;
  changed_at: string;
  changed_by: string | null;
}

export interface Milestone {
  id: string;
  property_id: string;
  milestone_type: string;
  target_date: string | null;
  actual_date: string | null;
  notes: string | null;
  created_at: string;
}

export interface FeedbackLog {
  id: string;
  user_id: string;
  type: 'Feature Request' | 'Bug Report';
  severity: 'Low' | 'Medium' | 'High' | null;
  title: string;
  description: string | null;
  screenshot_url: string | null;
  context: string | null;
  email: string | null;
  status: string;
  created_at: string;
}
