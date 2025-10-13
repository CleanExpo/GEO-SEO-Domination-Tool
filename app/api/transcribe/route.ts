/**
 * Audio Transcription API Route
 *
 * POST /api/transcribe
 *
 * Transcribes audio files using Whisper (via Groq API)
 * Supports multiple formats, languages, and output types
 */

import { NextRequest, NextResponse } from 'next/server';
import whisperService from '@/services/api/whisper';

export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes max

/**
 * POST /api/transcribe
 *
 * Body (multipart/form-data):
 * - file: Audio file (required)
 * - language: ISO 639-1 code (optional, e.g., 'en', 'es')
 * - responseFormat: 'json' | 'text' | 'srt' | 'vtt' (optional, default: 'json')
 * - withTimestamps: 'true' | 'false' (optional)
 * - action: 'transcribe' | 'summarize' | 'extract-actions' | 'seo-analysis' (optional)
 */
export async function POST(request: NextRequest) {
  try {
    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const language = formData.get('language') as string | null;
    const responseFormat = (formData.get('responseFormat') as string) || 'json';
    const withTimestamps = formData.get('withTimestamps') === 'true';
    const action = (formData.get('action') as string) || 'transcribe';

    // Validate file
    if (!file) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      );
    }

    // Validate file format
    if (!whisperService.isValidAudioFormat(file.name)) {
      return NextResponse.json(
        {
          error: 'Invalid audio format',
          supportedFormats: whisperService.SupportedAudioFormats,
        },
        { status: 400 }
      );
    }

    // Check file size (max 25MB)
    const maxSize = 25 * 1024 * 1024; // 25MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 25MB' },
        { status: 400 }
      );
    }

    // Handle different actions
    let result;

    switch (action) {
      case 'summarize':
        // Transcribe and summarize
        const summaryLength = (formData.get('summaryLength') as 'short' | 'medium' | 'long') || 'medium';
        result = await whisperService.transcribeAndSummarize(file, summaryLength);
        break;

      case 'extract-actions':
        // Extract action items (meeting notes)
        result = await whisperService.extractActionItems(file);
        break;

      case 'seo-analysis':
        // SEO video transcript analysis
        result = await whisperService.transcribeVideoForSEO(file);
        break;

      case 'transcribe':
      default:
        // Standard transcription
        if (withTimestamps) {
          const granularity = (formData.get('granularity') as 'word' | 'segment') || 'segment';
          result = await whisperService.transcribeWithTimestamps(file, granularity);
        } else if (responseFormat === 'srt') {
          result = await whisperService.transcribeToSRT(file, { language: language || undefined });
        } else if (responseFormat === 'vtt') {
          result = await whisperService.transcribeToVTT(file, { language: language || undefined });
        } else {
          result = await whisperService.transcribeAudio(file, {
            language: language || undefined,
            responseFormat: responseFormat as any,
          });
        }
        break;
    }

    // Detect language if not provided
    const detectedLanguage = language || (typeof result === 'object' && 'language' in result ? result.language : null);

    return NextResponse.json({
      success: true,
      result,
      metadata: {
        filename: file.name,
        fileSize: file.size,
        language: detectedLanguage,
        action,
        responseFormat,
      },
    });

  } catch (error: any) {
    console.error('Transcription API error:', error);
    return NextResponse.json(
      {
        error: 'Transcription failed',
        message: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/transcribe - Get API info
 */
export async function GET() {
  return NextResponse.json({
    service: 'Whisper Speech-to-Text (via Groq)',
    model: 'whisper-large-v3',
    supportedFormats: whisperService.SupportedAudioFormats,
    supportedLanguages: whisperService.getSupportedLanguages(),
    maxFileSize: '25MB',
    actions: [
      'transcribe',
      'summarize',
      'extract-actions',
      'seo-analysis',
    ],
    responseFormats: ['json', 'text', 'srt', 'vtt'],
    usage: {
      endpoint: 'POST /api/transcribe',
      contentType: 'multipart/form-data',
      parameters: {
        file: 'Audio file (required)',
        language: 'ISO 639-1 code (optional)',
        responseFormat: 'json | text | srt | vtt (default: json)',
        withTimestamps: 'true | false',
        action: 'transcribe | summarize | extract-actions | seo-analysis',
        summaryLength: 'short | medium | long (for summarize action)',
        granularity: 'word | segment (for timestamps)',
      },
    },
  });
}
