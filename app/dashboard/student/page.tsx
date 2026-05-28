'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useCallback, useEffect, useState } from 'react';
import { useClient } from '@/lib/supabase-browser';

type EventRecord = {
  id: string;
  title: string;
  description: string | null;
  date: string;
  venue: string;
};

type AttendanceFormState = {
  participation_type: 'organize' | 'volunteer' | 'participate';
  subsidiary_details: string;
};

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return String((error as { message?: unknown }).message);
  }
  return 'An unexpected error occurred';
};

export default function StudentDashboard() {
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<EventRecord | null>(null);
  const [formData, setFormData] = useState<AttendanceFormState>({
    participation_type: 'participate',
    subsidiary_details: '',
  });
  const [isOpen, setIsOpen] = useState(false);

  const supabase = useClient();

  // Fetch events
  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('date', { ascending: true });

      if (error) throw error;
      setEvents(data ?? []);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
      console.error('Error fetching events:', err);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  // Submit attendance request
  const submitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!selectedEvent) return;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('attendance_requests')
        .insert({
          event_id: selectedEvent.id,
          student_id: user.id,
          participation_type: formData.participation_type,
          subsidiary_details: formData.subsidiary_details,
          status: 'pending',
        });

      if (error) throw error;
      
      // Reset form and close dialog
      setFormData({ participation_type: 'participate', subsidiary_details: '' });
      setIsOpen(false);
      setSelectedEvent(null);
      
      // Optionally show success message
      alert('Attendance request submitted successfully!');
    } catch (err: unknown) {
      setError(getErrorMessage(err));
      console.error('Error submitting request:', err);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const run = async () => {
      if (!isMounted) return;
      await fetchEvents();
    };

    run();
    return () => {
      isMounted = false;
    };
  }, [fetchEvents]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Available Events</h1>

      {error && (
        <div className="rounded-bg p-4 text-destructive">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">
          Loading events...
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {events.length > 0 ? (
            events.map((event) => (
              <Card key={event.id} className="h-full cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => {
                      setSelectedEvent(event);
                      setIsOpen(true);
                    }}>
                <CardHeader>
                  <CardTitle className="text-lg">{event.title}</CardTitle>
                  <CardDescription>
                    {new Date(event.date).toLocaleDateString()} • {event.venue}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {event.description}
                  </p>
                </CardContent>
                <CardFooter className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">
                    Event ID: {event.id}
                  </span>
                  <Button variant="ghost" size="icon" aria-label="View details">
                    {/* Arrow icon would go here */}
                  </Button>
                </CardFooter>
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center py-8">
              No events available at the moment.
            </div>
          )}
        </div>
      )}

      {/* Request Attendance Dialog */}
      <Dialog open={isOpen && !!selectedEvent} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <button className="hidden" />
        </DialogTrigger>
        <DialogContent className="w-full max-w-md">
          <DialogHeader>
            <DialogTitle>Request Attendance</DialogTitle>
            <DialogDescription>
              {selectedEvent ? `For: ${selectedEvent.title}` : ''}
            </DialogDescription>
          </DialogHeader>
          <form id="request-form" onSubmit={submitRequest} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground block mb-1">
                Participation Type
              </label>
              <Select 
                value={formData.participation_type} 
                onValueChange={(value) => setFormData({ ...formData, participation_type: value as AttendanceFormState['participation_type'] })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select participation type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="organize">Organize</SelectItem>
                  <SelectItem value="volunteer">Volunteer</SelectItem>
                  <SelectItem value="participate">Participate</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground block mb-1">
                Subsidiary Details
              </label>
              <Textarea
                value={formData.subsidiary_details}
                onChange={(e) => setFormData({ ...formData, subsidiary_details: e.target.value })}
                placeholder="Describe your role, responsibilities, or any additional information"
                rows={4}
              />
            </div>
          </form>
          <DialogFooter>
            <Button type="button" onClick={() => {
              setIsOpen(false);
              setSelectedEvent(null);
            }} variant="outline">
              Cancel
            </Button>
            <Button type="submit" form="request-form" disabled={loading}>
              Submit Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
