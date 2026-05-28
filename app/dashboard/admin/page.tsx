'use client';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useCallback, useEffect, useState } from 'react';
import { useClient } from '@/lib/supabase-browser';
import { Pencil, Trash2, Plus } from 'lucide-react';

type EventRecord = {
  id: string;
  title: string;
  description: string | null;
  date: string;
  venue: string;
  created_by?: string | null;
};

type EventFormState = {
  title: string;
  description: string;
  date: string;
  venue: string;
};

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return String((error as { message?: unknown }).message);
  }
  return 'An unexpected error occurred';
};

export default function AdminDashboard() {
  const supabase = useClient();
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<EventFormState>({
    title: '',
    description: '',
    date: '',
    venue: '',
  });
  const [isOpen, setIsOpen] = useState(false);

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

  // Create event
  const createEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('events')
        .insert({
          title: formData.title,
          description: formData.description,
          date: formData.date,
          venue: formData.venue,
          created_by: user.id,
        });

      if (error) throw error;
      
      // Reset form and close dialog
      setFormData({ title: '', description: '', date: '', venue: '' });
      setIsOpen(false);
      
      // Refresh events
      await fetchEvents();
    } catch (err: unknown) {
      setError(getErrorMessage(err));
      console.error('Error creating event:', err);
    }
  };

  // Delete event
  const deleteEvent = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this event?')) return;
    
    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      await fetchEvents();
    } catch (err: unknown) {
      setError(getErrorMessage(err));
      console.error('Error deleting event:', err);
    }
  };

  // Fetch events on mount
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
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Event Management</h1>
          <p className="text-sm text-gray-500 mt-1">Create and manage upcoming college events.</p>
        </div>
        <Button variant="default" className="flex items-center gap-2" onClick={() => setIsOpen(true)}>
          <Plus className="w-4 h-4" /> Create Event
        </Button>
      </div>

      {error && (
        <div className="rounded-bg p-4 text-destructive">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-500">
          Loading events...
        </div>
      ) : (
        <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-gray-50/50">
              <TableRow>
                <TableHead className="w-1/3">Title</TableHead>
                <TableHead className="w-1/3">Date</TableHead>
                <TableHead className="w-1/3 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.length > 0 ? (
                events.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell className="font-medium text-gray-900">{event.title}</TableCell>
                    <TableCell className="text-gray-500">
                      {new Date(event.date).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </TableCell>
                    <TableCell className="flex justify-end space-x-2">
                      <Button variant="outline" size="icon" onClick={() => {
                        console.log('Edit event:', event.id);
                      }}>
                        <Pencil className="w-4 h-4 text-gray-500" />
                      </Button>
                      <Button variant="outline" size="icon" className="hover:bg-red-50 hover:text-red-600 hover:border-red-200" onClick={() => deleteEvent(event.id)}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-12 text-gray-500">
                    No events found. Click &quot;Create Event&quot; to get started.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Create Event Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="w-full max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Event</DialogTitle>
            <DialogDescription>
              Fill in the event details below
            </DialogDescription>
          </DialogHeader>
          <form id="create-event-form" onSubmit={createEvent} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground block mb-1">
                Title
              </label>
              <Input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter event title"
                required
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground block mb-1">
                Description
              </label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter event description"
                rows={4}
                required
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground block mb-1">
                Date
              </label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground block mb-1">
                Venue
              </label>
              <Input
                type="text"
                value={formData.venue}
                onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                placeholder="Enter event venue"
                required
              />
            </div>
          </form>
          <DialogFooter>
            <Button type="button" onClick={() => setIsOpen(false)} variant="outline">
              Cancel
            </Button>
            <Button type="submit" form="create-event-form" disabled={loading}>
              Create Event
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
