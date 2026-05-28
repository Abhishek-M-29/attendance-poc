-- Re-allow Faculty to update requests they are reviewing, and view their mentees requests
DROP POLICY IF EXISTS "Faculty can update requests they reviewed" ON public.attendance_requests;
CREATE POLICY "Faculty can update mentees requests" ON public.attendance_requests
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = student_id AND mentor_id = auth.uid()
    )
  );