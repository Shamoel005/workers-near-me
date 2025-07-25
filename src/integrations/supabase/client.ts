// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://njezddhyaddqffrvvbxl.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5qZXpkZGh5YWRkcWZmcnZ2YnhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI1NzYxMDAsImV4cCI6MjA2ODE1MjEwMH0.edlHi2WyV6xP8iPjv3LnThRbLP4sYXN-bC0tHEB2ud8";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});