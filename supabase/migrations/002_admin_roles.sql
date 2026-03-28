-- Add role column to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin', 'super_admin'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN NOT NULL DEFAULT false;

-- Update handle_new_user to assign super_admin role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name, avatar_url, role)
  VALUES (
    new.id,
    COALESCE(
      new.raw_user_meta_data->>'preferred_username',
      new.raw_user_meta_data->>'username',
      split_part(new.email, '@', 1)
    ),
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url',
    CASE WHEN new.email = 'emauel.draghetti@gmail.com' THEN 'super_admin' ELSE 'user' END
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = COALESCE(NULLIF(excluded.full_name, ''), profiles.full_name),
    avatar_url = COALESCE(excluded.avatar_url, profiles.avatar_url),
    role = CASE WHEN new.email = 'emauel.draghetti@gmail.com' THEN 'super_admin' ELSE profiles.role END;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Set super_admin for existing user if already exists
UPDATE profiles SET role = 'super_admin'
WHERE id IN (SELECT id FROM auth.users WHERE email = 'emauel.draghetti@gmail.com');

-- Allow all authenticated users to read all profiles (admins need to see blocked users too)
DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Profili pubblici" ON profiles;
CREATE POLICY "Profili pubblici" ON profiles
  FOR SELECT TO authenticated, anon
  USING (true);
