-- Copy and paste this into your Supabase SQL Editor and click RUN

DO $$
DECLARE
  faculty_id UUID;
  student_id UUID;
BEGIN
  -- Get the UUIDs of the newly created users
  SELECT id INTO faculty_id FROM auth.users WHERE email = 'faculty@mock.com';
  SELECT id INTO student_id FROM auth.users WHERE email = 'student@mock.com';

  -- Force Insert the Faculty Profile (Bypassing RLS because it's run as Postgres superuser here)
  IF faculty_id IS NOT NULL THEN
    INSERT INTO public.profiles (id, full_name, email, role) 
    VALUES (faculty_id, 'Faculty User', 'faculty@mock.com', 'faculty')
    ON CONFLICT (id) DO UPDATE SET role = 'faculty';
  END IF;

  -- Force Insert the Student Profile & Link to Faculty Mentor
  IF student_id IS NOT NULL AND faculty_id IS NOT NULL THEN
    INSERT INTO public.profiles (id, full_name, email, role, mentor_id) 
    VALUES (student_id, 'Student User', 'student@mock.com', 'student', faculty_id)
    ON CONFLICT (id) DO UPDATE SET role = 'student', mentor_id = faculty_id;
  END IF;

END $$;
