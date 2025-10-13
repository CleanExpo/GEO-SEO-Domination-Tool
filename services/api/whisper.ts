/**
 * Whisper Speech-to-Text Service (via Groq API)
 *
 * Ultra-fast, accurate audio transcription using OpenAI's Whisper model
 * running on Groq's inference infrastructure.
 *
 * Model: whisper-large-v3
 * Speed: ~300x faster than real-time
 * Accuracy: State-of-the-art multilingual speech recognition
 * Languages: 97+ languages supported
 *
 * Pricing: Part of Groq's competitive pricing (significantly cheaper than OpenAI)
 *
 * Use Cases:
 * - Client call transcription
 * - Video content analysis
 * - Meeting notes automation
 * - Voice memos to text
 * - Podcast transcription
 * - Multilingual content processing
 */

import OpenAI from 'openai';
import fs from 'fs';
import { Readable } from 'stream';

// Initialize Groq client with OpenAI SDK
const groqClient = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: 'https://api.groq.com/openai/v1',
});

/**
 * Available Whisper models on Groq
 */
export const WhisperModels = {
  // Full model - best accuracy
  LARGE_V3: 'whisper-large-v3',

  // Distilled model - faster, slight quality trade-off
  DISTIL_LARGE_V3_EN: 'distil-whisper-large-v3-en', // English only
} as const;

export type WhisperModel = typeof WhisperModels[keyof typeof WhisperModels];

/**
 * Supported audio formats
 */
export const SupportedAudioFormats = [
  'flac',
  'm4a',
  'mp3',
  'mp4',
  'mpeg',
  'mpga',
  'oga',
  'ogg',
  'wav',
  'webm',
] as const;

export type AudioFormat = typeof SupportedAudioFormats[number];

/**
 * Transcription response format options
 */
export type ResponseFormat = 'json' | 'text' | 'srt' | 'verbose_json' | 'vtt';

/**
 * Transcription options
 */
interface TranscriptionOptions {
  model?: WhisperModel;
  language?: string; // ISO 639-1 code (e.g., 'en', 'es', 'fr')
  prompt?: string; // Optional context to guide transcription
  responseFormat?: ResponseFormat;
  temperature?: number; // 0-1, controls randomness
  timestampGranularities?: ('word' | 'segment')[]; // For verbose_json format
}

/**
 * Transcription result (verbose format)
 */
interface TranscriptionResult {
  text: string;
  language?: string;
  duration?: number;
  segments?: Array<{
    id: number;
    seek: number;
    start: number;
    end: number;
    text: string;
    tokens: number[];
    temperature: number;
    avg_logprob: number;
    compression_ratio: number;
    no_speech_prob: number;
  }>;
  words?: Array<{
    word: string;
    start: number;
    end: number;
  }>;
}

/**
 * Transcribe audio file
 */
export async function transcribeAudio(
  audioFile: File | Buffer | string,
  options: TranscriptionOptions = {}
): Promise<TranscriptionResult | string> {
  const {
    model = WhisperModels.LARGE_V3,
    language,
    prompt,
    responseFormat = 'json',
    temperature = 0,
    timestampGranularities,
  } = options;

  try {
    let fileToTranscribe: File | fs.ReadStream;

    // Handle different input types
    if (typeof audioFile === 'string') {
      // File path
      fileToTranscribe = fs.createReadStream(audioFile) as any;
    } else if (Buffer.isBuffer(audioFile)) {
      // Buffer - convert to File-like object
      const blob = new Blob([audioFile]);
      fileToTranscribe = new File([blob], 'audio.mp3', { type: 'audio/mpeg' });
    } else {
      // Already a File object
      fileToTranscribe = audioFile;
    }

    const transcription = await groqClient.audio.transcriptions.create({
      file: fileToTranscribe,
      model,
      language,
      prompt,
      response_format: responseFormat,
      temperature,
      timestamp_granularities: timestampGranularities,
    } as any);

    return transcription as any;
  } catch (error: any) {
    console.error('Whisper transcription error:', error);
    throw new Error(`Whisper transcription failed: ${error.message}`);
  }
}

/**
 * Transcribe audio from URL
 */
export async function transcribeAudioFromURL(
  audioUrl: string,
  options: TranscriptionOptions = {}
): Promise<TranscriptionResult | string> {
  try {
    // Fetch audio from URL
    const response = await fetch(audioUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch audio: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Transcribe the downloaded audio
    return transcribeAudio(buffer, options);
  } catch (error: any) {
    console.error('Whisper URL transcription error:', error);
    throw new Error(`Failed to transcribe audio from URL: ${error.message}`);
  }
}

/**
 * Transcribe audio with timestamps (word-level or segment-level)
 */
export async function transcribeWithTimestamps(
  audioFile: File | Buffer | string,
  granularity: 'word' | 'segment' = 'segment'
): Promise<TranscriptionResult> {
  return transcribeAudio(audioFile, {
    responseFormat: 'verbose_json',
    timestampGranularities: [granularity],
  }) as Promise<TranscriptionResult>;
}

/**
 * Transcribe audio to SRT subtitle format
 */
export async function transcribeToSRT(
  audioFile: File | Buffer | string,
  options?: Omit<TranscriptionOptions, 'responseFormat'>
): Promise<string> {
  return transcribeAudio(audioFile, {
    ...options,
    responseFormat: 'srt',
  }) as Promise<string>;
}

/**
 * Transcribe audio to VTT subtitle format
 */
export async function transcribeToVTT(
  audioFile: File | Buffer | string,
  options?: Omit<TranscriptionOptions, 'responseFormat'>
): Promise<string> {
  return transcribeAudio(audioFile, {
    ...options,
    responseFormat: 'vtt',
  }) as Promise<string>;
}

/**
 * Batch transcribe multiple audio files
 */
export async function batchTranscribe(
  audioFiles: Array<File | Buffer | string>,
  options: TranscriptionOptions = {}
): Promise<Array<TranscriptionResult | string>> {
  const promises = audioFiles.map((file) => transcribeAudio(file, options));
  return Promise.all(promises);
}

/**
 * Transcribe with speaker diarization hint
 * Note: Whisper doesn't have built-in diarization, but we can guide it with prompts
 */
export async function transcribeWithSpeakers(
  audioFile: File | Buffer | string,
  speakerCount: number = 2
): Promise<TranscriptionResult> {
  const prompt = `This audio contains ${speakerCount} speakers. Please transcribe clearly.`;

  return transcribeAudio(audioFile, {
    prompt,
    responseFormat: 'verbose_json',
    timestampGranularities: ['segment'],
  }) as Promise<TranscriptionResult>;
}

/**
 * Transcribe and summarize (combines Whisper + Groq LLM)
 */
export async function transcribeAndSummarize(
  audioFile: File | Buffer | string,
  summaryLength: 'short' | 'medium' | 'long' = 'medium'
): Promise<{ transcript: string; summary: string }> {
  // Import Groq chat completion
  const { createChatCompletion, GroqModels } = await import('./groq');

  // Step 1: Transcribe audio
  const transcription = (await transcribeAudio(audioFile, {
    responseFormat: 'text',
  })) as string;

  // Step 2: Summarize with Groq LLM
  const summaryPrompt = {
    short: 'Summarize this transcript in 2-3 sentences.',
    medium: 'Summarize this transcript in 1-2 paragraphs, highlighting key points.',
    long: 'Provide a detailed summary of this transcript, including main topics, key points, and important details.',
  }[summaryLength];

  const summary = await createChatCompletion({
    model: GroqModels.LLAMA_8B_INSTANT, // Fast and cheap for summarization
    messages: [
      {
        role: 'system',
        content: 'You are a professional transcript summarizer. Create clear, concise summaries.',
      },
      {
        role: 'user',
        content: `${summaryPrompt}\n\nTranscript:\n${transcription}`,
      },
    ],
    temperature: 0.3,
    maxTokens: summaryLength === 'short' ? 150 : summaryLength === 'medium' ? 400 : 800,
  });

  return {
    transcript: transcription,
    summary: summary.content || '',
  };
}

/**
 * Extract action items from audio (meeting transcription use case)
 */
export async function extractActionItems(
  audioFile: File | Buffer | string
): Promise<{ transcript: string; actionItems: string[] }> {
  const { createChatCompletion, GroqModels } = await import('./groq');

  // Transcribe
  const transcription = (await transcribeAudio(audioFile, {
    responseFormat: 'text',
  })) as string;

  // Extract action items with LLM
  const result = await createChatCompletion({
    model: GroqModels.LLAMA_70B_VERSATILE,
    messages: [
      {
        role: 'system',
        content:
          'You are an expert at extracting action items from meeting transcripts. List each action item on a new line.',
      },
      {
        role: 'user',
        content: `Extract all action items from this transcript:\n\n${transcription}\n\nFormat: One action item per line.`,
      },
    ],
    temperature: 0.2,
    maxTokens: 500,
  });

  const actionItems = result.content
    ?.split('\n')
    .filter((line) => line.trim().length > 0)
    .map((line) => line.replace(/^[-*•]\s*/, '').trim()) || [];

  return {
    transcript: transcription,
    actionItems,
  };
}

/**
 * Detect language from audio
 */
export async function detectLanguage(audioFile: File | Buffer | string): Promise<string> {
  const result = (await transcribeAudio(audioFile, {
    responseFormat: 'verbose_json',
  })) as TranscriptionResult;

  return result.language || 'unknown';
}

/**
 * Get supported languages
 */
export function getSupportedLanguages(): string[] {
  return [
    'en', 'zh', 'de', 'es', 'ru', 'ko', 'fr', 'ja', 'pt', 'tr', 'pl', 'ca', 'nl', 'ar', 'sv',
    'it', 'id', 'hi', 'fi', 'vi', 'he', 'uk', 'el', 'ms', 'cs', 'ro', 'da', 'hu', 'ta', 'no',
    'th', 'ur', 'hr', 'bg', 'lt', 'la', 'mi', 'ml', 'cy', 'sk', 'te', 'fa', 'lv', 'bn', 'sr',
    'az', 'sl', 'kn', 'et', 'mk', 'br', 'eu', 'is', 'hy', 'ne', 'mn', 'bs', 'kk', 'sq', 'sw',
    'gl', 'mr', 'pa', 'si', 'km', 'sn', 'yo', 'so', 'af', 'oc', 'ka', 'be', 'tg', 'sd', 'gu',
    'am', 'yi', 'lo', 'uz', 'fo', 'ht', 'ps', 'tk', 'nn', 'mt', 'sa', 'lb', 'my', 'bo', 'tl',
    'mg', 'as', 'tt', 'haw', 'ln', 'ha', 'ba', 'jw', 'su',
  ];
}

/**
 * Calculate estimated transcription time
 * Whisper on Groq is ~300x faster than real-time
 */
export function estimateTranscriptionTime(audioDurationSeconds: number): number {
  // Groq Whisper is approximately 300x faster than real-time
  return audioDurationSeconds / 300; // seconds
}

/**
 * Validate audio file format
 */
export function isValidAudioFormat(filename: string): boolean {
  const extension = filename.split('.').pop()?.toLowerCase();
  return extension ? SupportedAudioFormats.includes(extension as AudioFormat) : false;
}

/**
 * Get audio duration from file (requires ffprobe or similar)
 * This is a placeholder - implement with actual audio processing library if needed
 */
export async function getAudioDuration(audioFile: string): Promise<number> {
  // TODO: Implement with ffprobe or audio processing library
  // For now, return estimate based on file size (rough approximation)
  const stats = fs.statSync(audioFile);
  const fileSizeMB = stats.size / (1024 * 1024);
  // Very rough estimate: 1MB ~= 1 minute of audio at typical bitrates
  return fileSizeMB * 60;
}

/**
 * Health check for Whisper service
 */
export async function healthCheck(): Promise<boolean> {
  try {
    // Create a minimal test audio buffer (silence)
    const testBuffer = Buffer.alloc(1024);
    await transcribeAudio(testBuffer, { responseFormat: 'text' });
    return true;
  } catch (error) {
    console.error('Whisper health check failed:', error);
    return false;
  }
}

/**
 * SEO Use Case: Transcribe video content for SEO optimization
 */
export async function transcribeVideoForSEO(
  videoAudioFile: File | Buffer | string
): Promise<{
  transcript: string;
  seoRecommendations: string;
  keywords: string[];
}> {
  const { createChatCompletion, GroqModels } = await import('./groq');

  // Transcribe video audio
  const transcript = (await transcribeAudio(videoAudioFile, {
    responseFormat: 'text',
  })) as string;

  // Extract SEO insights
  const seoAnalysis = await createChatCompletion({
    model: GroqModels.LLAMA_70B_VERSATILE,
    messages: [
      {
        role: 'system',
        content:
          'You are an SEO expert. Analyze video transcripts and provide SEO recommendations.',
      },
      {
        role: 'user',
        content: `Analyze this video transcript for SEO:\n\n${transcript.substring(0, 6000)}\n\nProvide:\n1. Key topics\n2. Main keywords (comma-separated)\n3. SEO recommendations for video optimization`,
      },
    ],
    temperature: 0.3,
    maxTokens: 800,
  });

  // Extract keywords (simple extraction - can be improved)
  const keywordMatch = seoAnalysis.content?.match(/keywords?:?\s*([^\n]+)/i);
  const keywords = keywordMatch
    ? keywordMatch[1].split(',').map((k) => k.trim())
    : [];

  return {
    transcript,
    seoRecommendations: seoAnalysis.content || '',
    keywords,
  };
}

export default {
  transcribeAudio,
  transcribeAudioFromURL,
  transcribeWithTimestamps,
  transcribeToSRT,
  transcribeToVTT,
  batchTranscribe,
  transcribeWithSpeakers,
  transcribeAndSummarize,
  extractActionItems,
  detectLanguage,
  getSupportedLanguages,
  estimateTranscriptionTime,
  isValidAudioFormat,
  getAudioDuration,
  healthCheck,
  transcribeVideoForSEO,
  WhisperModels,
  SupportedAudioFormats,
};
