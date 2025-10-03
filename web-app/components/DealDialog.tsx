'use client';

import { useState, useEffect } from 'react';
import { X, Loader2, Target } from 'lucide-react';

interface Contact {
  id: string;
  name: string;
  email: string;
  company?: string;
}

interface DealDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function DealDialog({ isOpen, onClose, onSuccess }: DealDialogProps) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [title, setTitle] = useState('');
  const [selectedContactId, setSelectedContactId] = useState('');
  const [company, setCompany] = useState('');
  const [contact, setContact] = useState('');
  const [value, setValue] = useState('');
  const [stage, setStage] = useState<'lead' | 'qualified' | 'proposal' | 'negotiation' | 'closed-won' | 'closed-lost'>('lead');
  const [probability, setProbability] = useState('0');
  const [closeDate, setCloseDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchContacts();
      // Set default close date to 30 days from now
      const defaultDate = new Date();
      defaultDate.setDate(defaultDate.getDate() + 30);
      setCloseDate(defaultDate.toISOString().split('T')[0]);
    }
  }, [isOpen]);

  const fetchContacts = async () => {
    setLoadingContacts(true);
    try {
      const res = await fetch('/api/crm/contacts');
      const data = await res.json();
      setContacts(data.contacts || []);
    } catch (err) {
      setError('Failed to load contacts');
    } finally {
      setLoadingContacts(false);
    }
  };

  const handleContactChange = (contactId: string) => {
    setSelectedContactId(contactId);
    const selectedContact = contacts.find(c => c.id === contactId);
    if (selectedContact) {
      setContact(selectedContact.name);
      if (selectedContact.company) {
        setCompany(selectedContact.company);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title || !company || !contact || !value || !selectedContactId || !closeDate) {
      setError('Please fill in all required fields');
      return;
    }

    const numValue = parseFloat(value);
    const numProbability = parseInt(probability);

    if (isNaN(numValue) || numValue <= 0) {
      setError('Deal value must be a positive number');
      return;
    }

    if (isNaN(numProbability) || numProbability < 0 || numProbability > 100) {
      setError('Probability must be between 0 and 100');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/crm/deals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          contact_id: selectedContactId,
          amount: numValue,
          stage,
          probability: numProbability,
          expected_close_date: closeDate,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to add deal');
      }

      onSuccess();
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add deal');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setTitle('');
    setSelectedContactId('');
    setCompany('');
    setContact('');
    setValue('');
    setStage('lead');
    setProbability('0');
    setCloseDate('');
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <Target className="h-5 w-5 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Add Deal</h2>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Deal Title *
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., New Website Redesign Project"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label htmlFor="contact-select" className="block text-sm font-medium text-gray-700 mb-2">
              Contact *
            </label>
            {loadingContacts ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
              </div>
            ) : (
              <select
                id="contact-select"
                value={selectedContactId}
                onChange={(e) => handleContactChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                required
              >
                <option value="">Select a contact...</option>
                {contacts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.company ? `(${c.company})` : ''}
                  </option>
                ))}
              </select>
            )}
            {contacts.length === 0 && !loadingContacts && (
              <p className="text-xs text-gray-500 mt-1">
                No contacts found. Please add a contact first.
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-2">
                Company *
              </label>
              <input
                id="company"
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="e.g., Acme Corporation"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label htmlFor="contact-name" className="block text-sm font-medium text-gray-700 mb-2">
                Contact Name *
              </label>
              <input
                id="contact-name"
                type="text"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="e.g., John Smith"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                required
                readOnly
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="value" className="block text-sm font-medium text-gray-700 mb-2">
                Deal Value ($) *
              </label>
              <input
                id="value"
                type="number"
                step="0.01"
                min="0"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="e.g., 50000"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label htmlFor="probability" className="block text-sm font-medium text-gray-700 mb-2">
                Probability (0-100) *
              </label>
              <input
                id="probability"
                type="number"
                min="0"
                max="100"
                value={probability}
                onChange={(e) => setProbability(e.target.value)}
                placeholder="e.g., 75"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="stage" className="block text-sm font-medium text-gray-700 mb-2">
                Stage *
              </label>
              <select
                id="stage"
                value={stage}
                onChange={(e) => setStage(e.target.value as typeof stage)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                required
              >
                <option value="lead">Lead</option>
                <option value="qualified">Qualified</option>
                <option value="proposal">Proposal</option>
                <option value="negotiation">Negotiation</option>
                <option value="closed-won">Closed Won</option>
                <option value="closed-lost">Closed Lost</option>
              </select>
            </div>

            <div>
              <label htmlFor="closeDate" className="block text-sm font-medium text-gray-700 mb-2">
                Expected Close Date *
              </label>
              <input
                id="closeDate"
                type="date"
                value={closeDate}
                onChange={(e) => setCloseDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                required
              />
            </div>
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
              disabled={loading || contacts.length === 0}
              className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add Deal'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
