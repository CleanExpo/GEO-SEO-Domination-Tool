'use client';

import { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Plus, Clock, Video, MapPin } from 'lucide-react';
import { EventDialog } from '@/components/EventDialog';

interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  duration: string;
  type: 'meeting' | 'call' | 'demo' | 'follow-up';
  attendees: string[];
  location?: string;
  notes?: string;
}

export default function CalendarPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch('/api/crm/calendar');

      if (!response.ok) {
        throw new Error('Failed to fetch events');
      }

      const data = await response.json();
      setEvents(data.events || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching events:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddEvent = () => {
    setIsDialogOpen(true);
  };

  const getTypeColor = (type: Event['type']) => {
    const colors = {
      meeting: 'bg-blue-100 text-blue-800 border-blue-200',
      call: 'bg-green-100 text-green-800 border-green-200',
      demo: 'bg-purple-100 text-purple-800 border-purple-200',
      'follow-up': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    };
    return colors[type];
  };

  const getTypeIcon = (type: Event['type']) => {
    switch (type) {
      case 'meeting':
        return <CalendarIcon className="h-4 w-4" />;
      case 'call':
        return <Clock className="h-4 w-4" />;
      case 'demo':
        return <Video className="h-4 w-4" />;
      case 'follow-up':
        return <MapPin className="h-4 w-4" />;
    }
  };

  // Group events by date
  const groupedEvents = events.reduce((acc, event) => {
    const date = event.date;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(event);
    return acc;
  }, {} as Record<string, Event[]>);

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-800 font-semibold mb-2">Error loading events</p>
          <p className="text-red-600 text-sm mb-4">{error}</p>
          <button
            onClick={fetchEvents}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Calendar</h1>
            <p className="text-gray-600 mt-1">Manage your meetings and events</p>
          </div>
          <button
            onClick={handleAddEvent}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            <Plus className="h-5 w-5" />
            Add Event
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 border border-gray-200/50">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-100 rounded-lg">
              <CalendarIcon className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Events</p>
              <p className="text-2xl font-bold text-gray-900">{events.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 border border-gray-200/50">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <CalendarIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Meetings</p>
              <p className="text-2xl font-bold text-gray-900">
                {events.filter(e => e.type === 'meeting').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 border border-gray-200/50">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Video className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Demos</p>
              <p className="text-2xl font-bold text-gray-900">
                {events.filter(e => e.type === 'demo').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 border border-gray-200/50">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <Clock className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Calls</p>
              <p className="text-2xl font-bold text-gray-900">
                {events.filter(e => e.type === 'call').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Events Timeline */}
      <div className="bg-white/80 backdrop-blur-sm rounded-lg border border-gray-200/50">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Upcoming Events</h2>
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mb-4"></div>
              <p className="text-gray-600">Loading events...</p>
            </div>
          ) : events.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="p-4 bg-gray-50 rounded-full mb-4">
                <CalendarIcon className="h-16 w-16 text-gray-300" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No events scheduled</h3>
              <p className="text-gray-600 text-center max-w-md mb-6">
                Keep track of meetings, calls, and demos by adding them to your calendar
              </p>
              <button
                onClick={handleAddEvent}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
              >
                <Plus className="h-5 w-5" />
                Add Your First Event
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedEvents).map(([date, dayEvents]) => (
                <div key={date}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex flex-col items-center bg-emerald-100 rounded-lg p-3 min-w-[70px]">
                      <span className="text-xs font-semibold text-emerald-600 uppercase">
                        {new Date(date).toLocaleDateString('en-US', { month: 'short' })}
                      </span>
                      <span className="text-2xl font-bold text-emerald-900">
                        {new Date(date).getDate()}
                      </span>
                    </div>
                    <div className="h-px flex-1 bg-gray-200" />
                  </div>
                  <div className="space-y-3 ml-4">
                    {dayEvents.map((event) => (
                      <div
                        key={event.id}
                        className={`p-4 rounded-lg border-2 ${getTypeColor(event.type)}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              {getTypeIcon(event.type)}
                              <h3 className="font-semibold text-gray-900">{event.title}</h3>
                              <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-white">
                                {event.type}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                <span>{event.time} ({event.duration})</span>
                              </div>
                              {event.location && (
                                <div className="flex items-center gap-1">
                                  <MapPin className="h-4 w-4" />
                                  <span>{event.location}</span>
                                </div>
                              )}
                            </div>
                            <div className="text-sm text-gray-600">
                              <span className="font-medium">Attendees:</span> {event.attendees.join(', ')}
                            </div>
                            {event.notes && (
                              <p className="text-sm text-gray-600 mt-2 italic">{event.notes}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <EventDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSuccess={() => fetchEvents()}
      />
    </div>
  );
}
