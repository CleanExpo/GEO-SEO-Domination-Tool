'use client';

/**
 * Audio Transcriber Component
 *
 * Provides UI for:
 * - Audio file upload
 * - Audio recording (browser microphone)
 * - Real-time transcription with Whisper
 * - Multiple output formats (text, SRT, VTT)
 * - Action extraction and summarization
 */

import React, { useState, useRef, useCallback } from 'react';
import { Upload, Mic, Square, Loader2, FileAudio, Download, Sparkles } from 'lucide-react';

interface TranscriptionResult {
  text?: string;
  transcript?: string;
  summary?: string;
  actionItems?: string[];
  keywords?: string[];
  seoRecommendations?: string;
  segments?: Array<{
    start: number;
    end: number;
    text: string;
  }>;
}

interface AudioTranscriberProps {
  onTranscriptionComplete?: (result: TranscriptionResult) => void;
  action?: 'transcribe' | 'summarize' | 'extract-actions' | 'seo-analysis';
  language?: string;
  className?: string;
}

export default function AudioTranscriber({
  onTranscriptionComplete,
  action = 'transcribe',
  language = 'en',
  className = '',
}: AudioTranscriberProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcription, setTranscription] = useState<TranscriptionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * Start recording audio from microphone
   */
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(audioBlob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setError(null);

      // Start timer
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (error: any) {
      setError('Failed to access microphone: ' + error.message);
    }
  };

  /**
   * Stop recording
   */
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  /**
   * Handle file upload
   */
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setAudioBlob(file);
      setError(null);
    }
  };

  /**
   * Transcribe audio
   */
  const transcribeAudio = useCallback(async () => {
    if (!audioBlob) {
      setError('No audio to transcribe');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', audioBlob, 'audio.webm');
      formData.append('language', language);
      formData.append('action', action);
      formData.append('responseFormat', 'json');

      if (action === 'transcribe') {
        formData.append('withTimestamps', 'true');
      }

      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Transcription failed');
      }

      const data = await response.json();
      setTranscription(data.result);

      if (onTranscriptionComplete) {
        onTranscriptionComplete(data.result);
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsProcessing(false);
    }
  }, [audioBlob, language, action, onTranscriptionComplete]);

  /**
   * Download transcript
   */
  const downloadTranscript = (format: 'txt' | 'srt' | 'vtt' = 'txt') => {
    if (!transcription) return;

    let content = '';
    let filename = 'transcript';
    let mimeType = 'text/plain';

    if (format === 'txt') {
      content = transcription.text || transcription.transcript || '';
      filename = 'transcript.txt';
    } else if (format === 'srt' || format === 'vtt') {
      // Convert segments to SRT/VTT format
      if (transcription.segments) {
        content = transcription.segments
          .map((seg, i) => {
            const start = formatTimestamp(seg.start, format);
            const end = formatTimestamp(seg.end, format);
            return format === 'srt'
              ? `${i + 1}\n${start} --> ${end}\n${seg.text}\n\n`
              : `${start} --> ${end}\n${seg.text}\n\n`;
          })
          .join('');
      }
      filename = `transcript.${format}`;
      mimeType = format === 'srt' ? 'application/x-subrip' : 'text/vtt';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  /**
   * Format timestamp for SRT/VTT
   */
  const formatTimestamp = (seconds: number, format: 'srt' | 'vtt'): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);

    const separator = format === 'srt' ? ',' : '.';
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}${separator}${String(ms).padStart(3, '0')}`;
  };

  /**
   * Format recording time
   */
  const formatRecordingTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Audio Transcription</h3>
          <p className="text-sm text-gray-500 mt-1">
            Record audio or upload a file to transcribe with Whisper AI
          </p>
        </div>

        {/* Recording Controls */}
        <div className="flex gap-4">
          {/* Record Button */}
          <button
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isProcessing}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              isRecording
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-blue-500 hover:bg-blue-600 text-white disabled:bg-gray-300'
            }`}
          >
            {isRecording ? (
              <>
                <Square className="w-4 h-4" />
                Stop Recording ({formatRecordingTime(recordingTime)})
              </>
            ) : (
              <>
                <Mic className="w-4 h-4" />
                Start Recording
              </>
            )}
          </button>

          {/* Upload Button */}
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing || isRecording}
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 disabled:bg-gray-50 disabled:text-gray-400 transition-colors"
          >
            <Upload className="w-4 h-4" />
            Upload Audio
          </button>
        </div>

        {/* Audio Preview */}
        {audioBlob && !isRecording && (
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <FileAudio className="w-5 h-5 text-blue-500" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Audio ready for transcription</p>
                <p className="text-xs text-gray-500">
                  Size: {(audioBlob.size / 1024).toFixed(2)} KB
                </p>
              </div>
              <button
                onClick={transcribeAudio}
                disabled={isProcessing}
                className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium bg-emerald-500 hover:bg-emerald-600 text-white disabled:bg-gray-300 transition-colors"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Transcribing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Transcribe
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Transcription Results */}
        {transcription && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-900">Results</h4>
              <div className="flex gap-2">
                <button
                  onClick={() => downloadTranscript('txt')}
                  className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  <Download className="w-4 h-4" />
                  Download TXT
                </button>
                {transcription.segments && (
                  <>
                    <button
                      onClick={() => downloadTranscript('srt')}
                      className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                    >
                      <Download className="w-4 h-4" />
                      SRT
                    </button>
                    <button
                      onClick={() => downloadTranscript('vtt')}
                      className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                    >
                      <Download className="w-4 h-4" />
                      VTT
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Transcript Text */}
            {(transcription.text || transcription.transcript) && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h5 className="text-sm font-medium text-gray-700 mb-2">Transcript</h5>
                <p className="text-sm text-gray-900 whitespace-pre-wrap">
                  {transcription.text || transcription.transcript}
                </p>
              </div>
            )}

            {/* Summary */}
            {transcription.summary && (
              <div className="bg-blue-50 rounded-lg p-4">
                <h5 className="text-sm font-medium text-blue-700 mb-2">Summary</h5>
                <p className="text-sm text-gray-900">{transcription.summary}</p>
              </div>
            )}

            {/* Action Items */}
            {transcription.actionItems && transcription.actionItems.length > 0 && (
              <div className="bg-emerald-50 rounded-lg p-4">
                <h5 className="text-sm font-medium text-emerald-700 mb-2">Action Items</h5>
                <ul className="space-y-1">
                  {transcription.actionItems.map((item, i) => (
                    <li key={i} className="text-sm text-gray-900 flex items-start gap-2">
                      <span className="text-emerald-500 mt-1">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* SEO Keywords */}
            {transcription.keywords && transcription.keywords.length > 0 && (
              <div className="bg-purple-50 rounded-lg p-4">
                <h5 className="text-sm font-medium text-purple-700 mb-2">Keywords</h5>
                <div className="flex flex-wrap gap-2">
                  {transcription.keywords.map((keyword, i) => (
                    <span
                      key={i}
                      className="px-2 py-1 bg-white rounded text-xs font-medium text-gray-700 border border-purple-200"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* SEO Recommendations */}
            {transcription.seoRecommendations && (
              <div className="bg-amber-50 rounded-lg p-4">
                <h5 className="text-sm font-medium text-amber-700 mb-2">SEO Recommendations</h5>
                <p className="text-sm text-gray-900 whitespace-pre-wrap">
                  {transcription.seoRecommendations}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
