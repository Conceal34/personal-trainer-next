-- 1. Create a secure, backend-only function to check for Admin status
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'ADMIN'
  );
END;
$$;

-- 2. Enable RLS on the table that had it disabled
ALTER TABLE client_progress_snapshots ENABLE ROW LEVEL SECURITY;

-- 3. Create fresh, secure Admin policies for every affected table
CREATE POLICY "secure_admin_profiles" ON profiles FOR ALL USING (public.is_admin());
CREATE POLICY "secure_admin_subscriptions" ON subscriptions FOR ALL USING (public.is_admin());
CREATE POLICY "secure_admin_workout_plans" ON workout_plans FOR ALL USING (public.is_admin());
CREATE POLICY "secure_admin_workout_logs" ON workout_logs FOR ALL USING (public.is_admin());
CREATE POLICY "secure_admin_weekly_checkins" ON weekly_checkins FOR ALL USING (public.is_admin());
CREATE POLICY "secure_admin_meetings" ON meetings FOR ALL USING (public.is_admin());
CREATE POLICY "secure_admin_snapshots" ON client_progress_snapshots FOR ALL USING (public.is_admin());

-- 4. Create fresh, secure Client policies (ensuring clients only see their own data)
CREATE POLICY "secure_client_profiles" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "secure_client_update_profiles" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "secure_client_subscriptions" ON subscriptions FOR SELECT USING (client_id = auth.uid());
CREATE POLICY "secure_client_workout_plans" ON workout_plans FOR SELECT USING (client_id = auth.uid());
CREATE POLICY "secure_client_workout_logs" ON workout_logs FOR ALL USING (client_id = auth.uid());
CREATE POLICY "secure_client_weekly_checkins" ON weekly_checkins FOR ALL USING (client_id = auth.uid());
CREATE POLICY "secure_client_meetings" ON meetings FOR ALL USING (client_id = auth.uid());
CREATE POLICY "secure_client_snapshots" ON client_progress_snapshots FOR SELECT USING (client_id = auth.uid());

-- 5. Automatically find and delete the old, vulnerable policies
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE qual LIKE '%user_metadata%' OR with_check LIKE '%user_metadata%'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', pol.policyname, pol.schemaname, pol.tablename);
    END LOOP;
END
$$;
