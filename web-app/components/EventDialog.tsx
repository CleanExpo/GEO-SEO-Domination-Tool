'use client';

import { useState } from 'react';
import { X, Loader2, Calendar } from 'lucide-react';

interface EventDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function EventDialog({ isOpen, onClose, onSuccess }: EventDialogProps) {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [duration, setDuration] = useState('');
  const [type, setType] = useState<'meeting' | 'call' | 'demo' | 'follow-up'>('meeting');
  const [attendees, setAttendees] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!title.trim()) {
      errors.title = 'Event title is required';
    }
    if (!date) {
      errors.date = 'Event date is required';
    }
    if (!time) {
      errors.time = 'Event time is required';
    }
    if (!duration.trim()) {
      errors.duration = 'Duration is required';
    } else if (!/^\d+\s*(h|hr|hour|hours|m|min|mins|minute|minutes)$/i.test(duration.trim())) {
      errors.duration = 'Duration must be in format like "1h", "30min", "2 hours"';
    }
    if (!attendees.trim()) {
      errors.attendees = 'At least one attendee is required';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      setError('Please fix the errors above');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Parse comma-separated attendees into array
      const attendeesArray = attendees
        .split(',')
        .map(a => a.trim())
        .filter(a => a.length > 0);

      const res = await fetch('/api/crm/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          event_date: date,
          event_time: time,
          duration: duration.trim(),
          type,
          attendees: attendeesArray,
          location: location.trim() || undefined,
          notes: notes.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create event');
      }

      onSuccess();
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setTitle('');
    setDate('');
    setTime('');
    setDuration('');
    setType('meeting');
    setAttendees('');
    setLocation('');
    setNotes('');
    setError('');
    setFieldErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <Calendar className="h-5 w-5 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Add Event</h2>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Event Title *
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Client Meeting - Website Redesign"
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${
                fieldErrors.title ? 'border-red-500' : 'border-gray-300'
              }`}
              required
            />
            {fieldErrors.title && (
              <p className="text-xs text-red-600 mt-1">{fieldErrors.title}</p>
            )}
          </div>

          {/* Date and Time Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
                Date *
              </label>
              <input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${
                  fieldErrors.date ? 'border-red-500' : 'border-gray-300'
                }`}
                required
              />
              {fieldErrors.date && (
                <p className="text-xs text-red-600 mt-1">{fieldErrors.date}</p>
              )}
            </div>

            <div>
              <label htmlFor="time" className="block text-sm font-medium text-gray-700 mb-2">
                Time *
              </label>
              <input
                id="time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${
                  fieldErrors.time ? 'border-red-500' : 'border-gray-300'
                }`}
                required
              />
              {fieldErrors.time && (
                <p className="text-xs text-red-600 mt-1">{fieldErrors.time}</p>
              )}
            </div>
          </div>

          {/* Duration and Type Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-2">
                Duration *
              </label>
              <input
                id="duration"
                type="text"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="e.g., 1h, 30min, 2 hours"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${
                  fieldErrors.duration ? 'border-red-500' : 'border-gray-300'
                }`}
                required
              />
              {fieldErrors.duration && (
                <p className="text-xs text-red-600 mt-1">{fieldErrors.duration}</p>
              )}
            </div>

            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
                Event Type *
              </label>
              <select
                id="type"
                value={type}
                onChange={(e) => setType(e.target.value as 'meeting' | 'call' | 'demo' | 'follow-up')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                required
              >
                <option value="meeting">Meeting</option>
                <option value="call">Call</option>
                <option value="demo">Demo</option>
                <option value="follow-up">Follow-up</option>
              </select>
            </div>
          </div>

          {/* Attendees */}
          <div>
            <label htmlFor="attendees" className="block text-sm font-medium text-gray-700 mb-2">
              Attendees *
            </label>
            <input
              id="attendees"
              type="text"
              value={attendees}
              onChange={(e) => setAttendees(e.target.value)}
              placeholder="e.g., John Doe, jane@example.com, Sarah Smith"
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${
                fieldErrors.attendees ? 'border-red-500' : 'border-gray-300'
              }`}
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Separate multiple attendees with commas
            </p>
            {fieldErrors.attendees && (
              <p className="text-xs text-red-600 mt-1">{fieldErrors.attendees}</p>
            )}
          </div>

          {/* Location */}
          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
              Location (Optional)
            </label>
            <input
              id="location"
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g., Conference Room A, Zoom, Office"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
              Notes (Optional)
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any additional notes or agenda items..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating Event...
                </>
              ) : (
                'Add Event'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
