'use client';

/**
 * Credential Assistant Component
 *
 * AI-powered chat interface to help clients find their credentials
 * Features:
 * - Real-time Qwen3 AI assistance
 * - YouTube video integration
 * - Auto-fill suggestions
 * - Platform-specific guidance
 */

import React, { useState, useRef, useEffect } from 'react';
import { Loader2, Send, Video, CheckCircle, Clock, Sparkles, X, Youtube } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  steps?: Array<{
    step: number;
    action: string;
    url?: string;
  }>;
  videoTutorial?: {
    title: string;
    url: string;
    timestamp?: string;
  };
  autofillSuggestions?: Record<string, string>;
  estimatedTime?: string;
  timestamp: Date;
}

interface CredentialAssistantProps {
  platform?: string;
  hostingProvider?: string;
  context?: {
    businessType?: string;
    websiteUrl?: string;
    detectedPlatform?: string;
  };
  onAutofill?: (suggestions: Record<string, string>) => void;
  onClose?: () => void;
}

export function CredentialAssistant({
  platform,
  hostingProvider,
  context,
  onAutofill,
  onClose
}: CredentialAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: `Hi! I'm here to help you find your credentials. 👋\n\nJust tell me what you need help with, like:\n• "How do I find my WordPress admin password?"\n• "Where is my Facebook Business ID?"\n• "I need my cPanel login for GoDaddy"\n\nWhat can I help you with?`,
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [currentVideo, setCurrentVideo] = useState<{ title: string; url: string; timestamp?: string } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/onboarding/credential-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userQuery: userMessage.content,
          platform,
          hostingProvider,
          context
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get assistance');
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.message,
        steps: data.steps,
        videoTutorial: data.videoTutorial,
        autofillSuggestions: data.autofillSuggestions,
        estimatedTime: data.estimatedTime,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Show video if available
      if (data.videoTutorial) {
        setCurrentVideo(data.videoTutorial);
      }

    } catch (error: any) {
      console.error('Credential Assistant Error:', error);

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `I'm having trouble right now. Here's what you can try:\n\n1. Check your hosting provider's welcome email\n2. Visit your hosting control panel\n3. Contact your provider's support\n\nWould you like to try asking again?`,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);

      toast({
        title: 'Connection Issue',
        description: 'Having trouble connecting to the assistant. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAutofill = (suggestions: Record<string, string>) => {
    if (onAutofill) {
      onAutofill(suggestions);
      toast({
        title: '✨ Auto-filled!',
        description: `Filled ${Object.keys(suggestions).length} field${Object.keys(suggestions).length !== 1 ? 's' : ''} for you`,
        duration: 3000
      });
    }
  };

  const openVideo = (video: { title: string; url: string; timestamp?: string }) => {
    let videoUrl = video.url;

    // Add timestamp if provided (e.g., ?t=90 for 1:30)
    if (video.timestamp) {
      const [minutes, seconds] = video.timestamp.split(':').map(Number);
      const totalSeconds = (minutes || 0) * 60 + (seconds || 0);
      videoUrl += `?t=${totalSeconds}`;
    }

    // Open in new tab
    window.open(videoUrl, '_blank', 'noopener,noreferrer');
  };

  // Quick action buttons
  const quickActions = [
    { label: 'WordPress Login', query: 'How do I find my WordPress admin login?' },
    { label: 'cPanel Access', query: 'Where is my cPanel login?' },
    { label: 'Facebook Token', query: 'How do I get my Facebook access token?' },
    { label: 'Google Business', query: 'How do I connect Google Business Profile?' }
  ];

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-lg">
      <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Credential Assistant</CardTitle>
              <CardDescription>Powered by Qwen3 AI</CardDescription>
            </div>
          </div>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {/* Messages */}
        <div className="h-96 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>

                {/* Steps */}
                {message.steps && message.steps.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {message.steps.map((step) => (
                      <div key={step.step} className="flex items-start gap-2 text-sm">
                        <Badge variant="secondary" className="shrink-0">
                          {step.step}
                        </Badge>
                        <div>
                          <p>{step.action}</p>
                          {step.url && (
                            <a
                              href={step.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline text-xs"
                            >
                              {step.url}
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Estimated Time */}
                {message.estimatedTime && (
                  <div className="mt-2 flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                    <Clock className="h-3 w-3" />
                    <span>Takes about {message.estimatedTime}</span>
                  </div>
                )}

                {/* Video Tutorial */}
                {message.videoTutorial && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3 w-full"
                    onClick={() => openVideo(message.videoTutorial!)}
                  >
                    <Youtube className="h-4 w-4 mr-2 text-red-600" />
                    Watch: {message.videoTutorial.title}
                  </Button>
                )}

                {/* Autofill Suggestions */}
                {message.autofillSuggestions && Object.keys(message.autofillSuggestions).length > 0 && (
                  <Button
                    variant="default"
                    size="sm"
                    className="mt-3 w-full bg-emerald-600 hover:bg-emerald-700"
                    onClick={() => handleAutofill(message.autofillSuggestions!)}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Auto-fill {Object.keys(message.autofillSuggestions).length} field
                    {Object.keys(message.autofillSuggestions).length !== 1 ? 's' : ''}
                  </Button>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-3">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
                  <span className="text-sm text-gray-500">Thinking...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Actions */}
        {messages.length === 1 && (
          <div className="p-4 border-t bg-white dark:bg-gray-800">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Quick actions:</p>
            <div className="flex flex-wrap gap-2">
              {quickActions.map((action) => (
                <Button
                  key={action.label}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setInput(action.query);
                    handleSubmit({ preventDefault: () => {} } as React.FormEvent);
                  }}
                  disabled={loading}
                >
                  {action.label}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <form onSubmit={handleSubmit} className="p-4 border-t bg-white dark:bg-gray-800">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me anything about finding credentials..."
              disabled={loading}
              className="flex-1"
            />
            <Button type="submit" disabled={loading || !input.trim()} size="icon">
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
