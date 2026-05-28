-- Run this in your Supabase Dashboard -> SQL Editor to create mock users

-- Enable pgcrypto if not already enabled (required for password hashing)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  admin_uid UUID := gen_random_uuid();
  faculty_uid UUID := gen_random_uuid();
  student_uid UUID := gen_random_uuid();
BEGIN
  -- Clean up existing mock users if you ran this before
  DELETE FROM auth.users WHERE email IN ('admin@example.com', 'faculty@example.com', 'student@example.com');

  -- ==========================================
  -- 1. Insert Admin
  -- ==========================================
  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, 
    created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_super_admin
  ) VALUES (
    admin_uid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'admin@example.com', crypt('password123', gen_salt('bf')), NOW(), 
    NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{}', false
  );
  
  INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  VALUES (gen_random_uuid(), admin_uid, admin_uid::text, format('{"sub":"%s","email":"%s"}', admin_uid::text, 'admin@example.com')::jsonb, 'email', NOW(), NOW(), NOW());

  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (admin_uid, 'Admin User', 'admin@example.com', 'super_admin');

  -- ==========================================
  -- 2. Insert Faculty
  -- ==========================================
  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, 
    created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_super_admin
  ) VALUES (
    faculty_uid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'faculty@example.com', crypt('password123', gen_salt('bf')), NOW(), 
    NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{}', false
  );

  INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  VALUES (gen_random_uuid(), faculty_uid, faculty_uid::text, format('{"sub":"%s","email":"%s"}', faculty_uid::text, 'faculty@example.com')::jsonb, 'email', NOW(), NOW(), NOW());

  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (faculty_uid, 'Faculty User', 'faculty@example.com', 'faculty');

  -- ==========================================
  -- 3. Insert Student
  -- ==========================================
  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, 
    created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_super_admin
  ) VALUES (
    student_uid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'student@example.com', crypt('password123', gen_salt('bf')), NOW(), 
    NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{}', false
  );

  INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  VALUES (gen_random_uuid(), student_uid, student_uid::text, format('{"sub":"%s","email":"%s"}', student_uid::text, 'student@example.com')::jsonb, 'email', NOW(), NOW(), NOW());

  -- Link student to the faculty as mentor
  INSERT INTO public.profiles (id, full_name, email, role, mentor_id)
  VALUES (student_uid, 'Student User', 'student@example.com', 'student', faculty_uid);

  -- ==========================================
  -- 4. Create a mock event
  -- ==========================================
  INSERT INTO public.events (title, description, date, venue, created_by)
  VALUES ('Annual Tech Symposium', 'A 2-day tech event with workshops and guest speakers.', '2026-10-15', 'Main Auditorium', admin_uid);

END $$;