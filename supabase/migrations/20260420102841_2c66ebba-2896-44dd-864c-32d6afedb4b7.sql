-- 1. Role enum
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'user');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 2. user_roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 3. has_role function (security definer to avoid recursive RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- 4. RLS policies for user_roles
DROP POLICY IF EXISTS "user_roles_select_own" ON public.user_roles;
CREATE POLICY "user_roles_select_own"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "user_roles_admin_insert" ON public.user_roles;
CREATE POLICY "user_roles_admin_insert"
  ON public.user_roles FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "user_roles_admin_delete" ON public.user_roles;
CREATE POLICY "user_roles_admin_delete"
  ON public.user_roles FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 5. Admin analytics function
CREATE OR REPLACE FUNCTION public.get_admin_analytics()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  SELECT jsonb_build_object(
    'totalUsers', (SELECT count(*) FROM public.profiles),
    'totalScreenings', (SELECT count(*) FROM public.screening_results),
    'avgPhq9', COALESCE((SELECT round(avg(phq9_score)::numeric, 2) FROM public.screening_results), 0),
    'highRiskCount', (SELECT count(DISTINCT user_id) FROM public.screening_results WHERE phq9_score >= 15),
    'severityDistribution', COALESCE((
      SELECT jsonb_agg(jsonb_build_object('severity', severity, 'count', c))
      FROM (
        SELECT severity, count(*) AS c
        FROM public.screening_results
        GROUP BY severity
      ) s
    ), '[]'::jsonb),
    'phq9Trend', COALESCE((
      SELECT jsonb_agg(jsonb_build_object('date', d, 'avg', a) ORDER BY d)
      FROM (
        SELECT to_char(date_trunc('day', created_at), 'YYYY-MM-DD') AS d,
               round(avg(phq9_score)::numeric, 2) AS a
        FROM public.screening_results
        WHERE created_at >= now() - interval '30 days'
        GROUP BY 1
      ) t
    ), '[]'::jsonb),
    'highRiskUsers', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'user_id', sr.user_id,
        'display_name', p.display_name,
        'phq9_score', sr.phq9_score,
        'severity', sr.severity,
        'created_at', sr.created_at
      ) ORDER BY sr.created_at DESC)
      FROM (
        SELECT DISTINCT ON (user_id) user_id, phq9_score, severity, created_at
        FROM public.screening_results
        WHERE phq9_score >= 15
        ORDER BY user_id, created_at DESC
      ) sr
      LEFT JOIN public.profiles p ON p.id = sr.user_id
    ), '[]'::jsonb)
  ) INTO result;

  RETURN result;
END;
$$;