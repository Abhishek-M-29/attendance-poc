'use client';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useEffect, useState } from 'react';
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
  status: 'approved' | 'rejected';
  created_at: string;
  reviewed_at: string | null;
  events: EventRecord | null;
  profiles: ProfileRecord | null;
};

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return String((error as { message?: unknown }).message);
  }
  return 'An unexpected error occurred';
};

export default function FacultyHistory() {
  const [requests, setRequests] = useState<AttendanceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = useClient();

  useEffect(() => {
    const fetchRequests = async () => {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

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
            reviewed_at,
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
          .eq('reviewed_by', user.id)
          .in('status', ['approved', 'rejected'])
          .order('reviewed_at', { ascending: false });

        if (error) throw error;
        const normalized: AttendanceRequest[] = (data || []).map((item) => ({
          id: item.id,
          event_id: item.event_id,
          student_id: item.student_id,
          participation_type: item.participation_type,
          subsidiary_details: item.subsidiary_details,
          status: item.status,
          created_at: item.created_at,
          reviewed_at: item.reviewed_at,
          events: Array.isArray(item.events) ? item.events[0] ?? null : item.events ?? null,
          profiles: Array.isArray(item.profiles) ? item.profiles[0] ?? null : item.profiles ?? null,
        }));
        setRequests(normalized);
      } catch (err: unknown) {
        setError(getErrorMessage(err));
        console.error('Error fetching faculty history:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchRequests();
  }, [supabase]);

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Approval History</h1>
        <p className="text-sm text-gray-500 mt-1">Review your past attendance request decisions.</p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-md text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-500">
          Loading history...
        </div>
      ) : (
        <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-gray-50/50">
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Event</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Reviewed At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.length > 0 ? (
                requests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium text-gray-900">
                      {request.profiles?.full_name || 'Unknown Student'}
                    </TableCell>
                    <TableCell className="text-gray-700">
                      {request.events?.title || 'Unknown Event'}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={request.status === 'approved' ? 'outline' : 'secondary'}
                        className={
                          request.status === 'approved' 
                            ? 'bg-green-50 text-green-700 border-green-200'
                            : 'bg-red-50 text-red-700 border-red-200'
                        }
                      >
                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-500">
                      {request.reviewed_at ? new Date(request.reviewed_at).toLocaleDateString() : 'N/A'}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-12 text-gray-500">
                    No approval history found.
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
