-- Create profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  email TEXT UNIQUE,
  role TEXT CHECK (role IN ('super_admin', 'faculty', 'student')) NOT NULL,
  mentor_id UUID REFERENCES public.profiles(id), -- For faculty-student mentorship
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create events table
CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  venue TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create attendance_requests table
CREATE TABLE IF NOT EXISTS public.attendance_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  student_id UUID REFERENCES auth.users(id),
  participation_type TEXT CHECK (participation_type IN ('organize', 'volunteer', 'participate')) NOT NULL,
  subsidiary_details TEXT,
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_requests ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Events policies
CREATE POLICY "Anyone can view events" ON public.events
  FOR SELECT USING (true);

CREATE POLICY "Only super_admin can create events" ON public.events
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

CREATE POLICY "Only super_admin can update/delete events" ON public.events
  FOR UPDATE OR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- Attendance requests policies
CREATE POLICY "Students can create requests" ON public.attendance_requests
  FOR INSERT WITH CHECK (
    auth.uid() = student_id
  );

CREATE POLICY "Students can view their own requests" ON public.attendance_requests
  FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "Faculty can view requests from their mentees" ON public.attendance_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'faculty'
    ) AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = student_id AND mentor_id = auth.uid()
    )
  );

CREATE POLICY "Faculty can update requests they reviewed" ON public.attendance_requests
  FOR UPDATE USING (
    auth.uid() = reviewed_by
  );

CREATE POLICY "Super admin can view all requests" ON public.attendance_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_attendance_requests_updated_at BEFORE UPDATE ON public.attendance_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();