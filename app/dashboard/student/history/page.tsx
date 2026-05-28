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

type AttendanceRequest = {
  id: string;
  event_id: string;
  participation_type: 'organize' | 'volunteer' | 'participate';
  subsidiary_details: string | null;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  reviewed_at: string | null;
  events: EventRecord | null;
};

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return String((error as { message?: unknown }).message);
  }
  return 'An unexpected error occurred';
};

export default function StudentHistory() {
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
            )
          `)
          .eq('student_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        const normalized: AttendanceRequest[] = (data || []).map((item) => ({
          id: item.id,
          event_id: item.event_id,
          participation_type: item.participation_type,
          subsidiary_details: item.subsidiary_details,
          status: item.status,
          created_at: item.created_at,
          reviewed_at: item.reviewed_at,
          events: Array.isArray(item.events) ? item.events[0] ?? null : item.events ?? null,
        }));
        setRequests(normalized);
      } catch (err: unknown) {
        setError(getErrorMessage(err));
        console.error('Error fetching history:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchRequests();
  }, [supabase]);

  const getStatusBadgeVariant = (status: AttendanceRequest['status']) => {
    switch (status) {
      case 'approved': return 'bg-green-50 text-green-700 border-green-200';
      case 'rejected': return 'bg-red-50 text-red-700 border-red-200';
      case 'pending': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Request History</h1>
        <p className="text-sm text-gray-500 mt-1">Track the status of your past attendance requests.</p>
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
                <TableHead>Event</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Submitted</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.length > 0 ? (
                requests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium text-gray-900">
                      {request.events?.title || 'Unknown Event'}
                    </TableCell>
                    <TableCell className="text-gray-600">
                      {request.events?.date ? new Date(request.events.date).toLocaleDateString() : 'N/A'}
                    </TableCell>
                    <TableCell className="capitalize text-gray-600">
                      {request.participation_type}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getStatusBadgeVariant(request.status)}>
                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-500">
                      {new Date(request.created_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-gray-500">
                  No requests found. Check out the &quot;Available Events&quot; tab to participate.
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
