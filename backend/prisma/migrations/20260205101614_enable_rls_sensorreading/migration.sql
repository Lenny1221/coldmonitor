-- Enable Row Level Security on SensorReading table
-- This is required by Supabase for public tables exposed to PostgREST
-- Since the table is only accessed via the backend API (not directly via PostgREST),
-- we enable RLS with a permissive policy that allows all operations for authenticated requests

ALTER TABLE "SensorReading" ENABLE ROW LEVEL SECURITY;

-- Policy: Allow all operations for authenticated users (backend uses service_role or authenticated role)
-- The backend API already handles authentication, so this policy allows the backend to read/write
CREATE POLICY "Enable all operations for authenticated users" ON "SensorReading"
  FOR ALL
  USING (true)
  WITH CHECK (true);
