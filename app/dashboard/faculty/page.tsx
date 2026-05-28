'use client';

import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useCallback, useEffect, useState } from 'react';
import { useClient } from '@/lib/supabase-browser';

type EventRecord = {
  id: string;
  title: string;
  date: string;
  venue: string;
};

type ProfileRecord = {
  id: string;
  full_name: string | null;
  email: string | null;
};

type AttendanceRequest = {
  id: string;
  event_id: string;
  student_id: string;
  participation_type: 'organize' | 'volunteer' | 'participate';
  subsidiary_details: string | null;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  events: EventRecord | null;
  profiles: ProfileRecord | null;
};

type FacultyProfile = {
  id: string;
  role: 'faculty' | 'student' | 'super_admin';
};

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return String((error as { message?: unknown }).message);
  }
  return 'An unexpected error occurred';
};

export default function FacultyDashboard() {
  const supabase = useClient();
  const [requests, setRequests] = useState<AttendanceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch pending requests for mentees
  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Get faculty profile to confirm role and get ID
      const { data: facultyProfile, error: profileError } = await supabase
        .from('profiles')
        .select('id, role')
        .eq('id', user.id)
        .single<FacultyProfile>();

      if (profileError) throw profileError;
      if (!facultyProfile || facultyProfile.role !== 'faculty') {
        throw new Error('Access denied: Faculty role required');
      }

      // Fetch requests where the student's mentor_id matches the faculty's id
      const { data, error } = await supabase
        .from('attendance_requests')
        .select(`
          id,
          event_id,
          student_id,
          participation_type,
          subsidiary_details,
          status,
          created_at,
          events!inner (
            id,
            title,
            date,
            venue
          ),
          profiles!attendance_requests_student_id_fkey (
            id,
            full_name,
            email
          )
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const normalized: AttendanceRequest[] = (data || []).map((item) => ({
        id: item.id,
        event_id: item.event_id,
        student_id: item.student_id,
        participation_type: item.participation_type,
        subsidiary_details: item.subsidiary_details,
        status: item.status,
        created_at: item.created_at,
        events: Array.isArray(item.events) ? item.events[0] ?? null : item.events ?? null,
        profiles: Array.isArray(item.profiles) ? item.profiles[0] ?? null : item.profiles ?? null,
      }));
      setRequests(normalized);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
      console.error('Error fetching requests:', err);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  // Approve request
  const approveRequest = async (id: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('attendance_requests')
        .update({
          status: 'approved',
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;
      
      // Remove the approved request from the list
      setRequests(prev => prev.filter(req => req.id !== id));
    } catch (err: unknown) {
      setError(getErrorMessage(err));
      console.error('Error approving request:', err);
    }
  };

  // Reject request
  const rejectRequest = async (id: string) => {
    if (!window.confirm('Are you sure you want to reject this request?')) return;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('attendance_requests')
        .update({
          status: 'rejected',
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;
      
      // Remove the rejected request from the list
      setRequests(prev => prev.filter(req => req.id !== id));
    } catch (err: unknown) {
      setError(getErrorMessage(err));
      console.error('Error rejecting request:', err);
    }
  };

  // Fetch requests on mount
  useEffect(() => {
    let isMounted = true;

    const run = async () => {
      if (!isMounted) return;
      await fetchRequests();
    };

    run();
    return () => {
      isMounted = false;
    };
  }, [fetchRequests]);

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Pending Requests</h1>
        <p className="text-sm text-gray-500 mt-1">Review and manage attendance requests from your mentees.</p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-md text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-500">
          Loading requests...
        </div>
      ) : (
        <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-blue-50/50">
              <TableRow>
                <TableHead className="w-1/3">Student</TableHead>
                <TableHead className="w-1/3">Event</TableHead>
                <TableHead className="w-1/6">Status</TableHead>
                <TableHead className="w-1/6 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.length > 0 ? (
                requests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>
                      {request.profiles ? (
                        <div className="flex items-center space-x-3">
                          <div className="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center text-sm font-medium text-gray-600">
                            {request.profiles.full_name?.charAt(0) ?? 'U'}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{request.profiles.full_name}</p>
                            <p className="text-xs text-gray-500">{request.profiles.email}</p>
                          </div>
                        </div>
                      ) : (
                        <p className="text-gray-500">Unknown Student</p>
                      )}
                    </TableCell>
                    <TableCell>
                      {request.events ? (
                        <div>
                          <p className="font-medium text-gray-900">{request.events.title}</p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {new Date(request.events.date).toLocaleDateString()} • {request.events.venue}
                          </p>
                        </div>
                      ) : (
                        <p className="text-gray-500">Unknown Event</p>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={request.status === 'pending' ? 'outline' : 'secondary'} className="bg-yellow-50 text-yellow-700 border-yellow-200">
                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="flex justify-end space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => approveRequest(request.id)}
                        className="text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200"
                      >
                        Approve
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => rejectRequest(request.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                      >
                        Reject
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-12 text-gray-500">
                    No pending requests to review.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
