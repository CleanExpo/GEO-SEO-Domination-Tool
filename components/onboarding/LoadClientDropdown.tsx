'use client';

/**
 * Load Client Dropdown Component
 *
 * Displays an alphabetically sorted dropdown of saved client onboarding sessions
 * Allows users to load previously saved client data into the form
 */

import { useState, useEffect } from 'react';
import { FolderOpen, Search, Loader2, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface SavedClient {
  id: string;
  businessName: string;
  email: string;
  industry: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  companyId: string | null;
  createdAt: string;
  completedAt: string | null;
  formData: any;
}

interface LoadClientDropdownProps {
  onClientLoad: (formData: any, clientId: string) => void;
}

export function LoadClientDropdown({ onClientLoad }: LoadClientDropdownProps) {
  const [savedClients, setSavedClients] = useState<SavedClient[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const { toast } = useToast();

  // Fetch saved clients on mount
  useEffect(() => {
    fetchSavedClients();
  }, []);

  const fetchSavedClients = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/onboarding/saved');
      const data = await response.json();

      if (data.success) {
        setSavedClients(data.clients || []);
        console.log('[Load Client] Loaded', data.count, 'saved clients');
      } else {
        toast({
          title: 'Failed to load clients',
          description: data.error || 'Could not fetch saved clients',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('[Load Client] Error:', error);
      toast({
        title: 'Error loading clients',
        description: 'Network error occurred',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClientSelect = (clientId: string) => {
    setSelectedClientId(clientId);
    const client = savedClients.find(c => c.id === clientId);

    if (client && client.formData) {
      onClientLoad(client.formData, client.id);
      toast({
        title: 'Client Loaded',
        description: `${client.businessName} data has been loaded into the form`,
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'in_progress':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 p-4 border border-dashed rounded-lg">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Loading saved clients...</span>
      </div>
    );
  }

  if (savedClients.length === 0) {
    return (
      <div className="flex items-center justify-center gap-2 p-4 border border-dashed rounded-lg bg-muted/10">
        <FolderOpen className="h-5 w-5 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">No saved clients yet</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-2">
        <FolderOpen className="h-5 w-5 text-muted-foreground" />
        <span className="text-sm font-medium">Load Saved Client</span>
        <Badge variant="secondary" className="ml-auto">
          {savedClients.length} {savedClients.length === 1 ? 'client' : 'clients'}
        </Badge>
      </div>

      <Select value={selectedClientId} onValueChange={handleClientSelect}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select a client to load..." />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Saved Clients (A-Z)</SelectLabel>
            {savedClients.map((client) => (
              <SelectItem key={client.id} value={client.id}>
                <div className="flex items-center gap-2 w-full">
                  {getStatusIcon(client.status)}
                  <span className="font-medium">{client.businessName}</span>
                  <span className="text-xs text-muted-foreground ml-2">
                    {client.industry}
                  </span>
                  <Badge
                    variant="outline"
                    className={`ml-auto text-xs ${getStatusColor(client.status)}`}
                  >
                    {client.status}
                  </Badge>
                </div>
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>

      <p className="text-xs text-muted-foreground">
        Select a previously saved client to auto-fill the form with their information
      </p>
    </div>
  );
}
