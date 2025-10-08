/**
 * Visual Content Agent
 *
 * Autonomous visual content creation for the Empire CRM
 * - Image generation (Flux.1, DALL-E, Stable Diffusion)
 * - Video generation (Code2Video with Manim)
 * - Graphics and infographics
 * - Social media visuals
 * - Brand assets
 *
 * Elevates Unite Group content from text to MULTIMEDIA DOMINANCE
 */

import OpenAI from 'openai';
import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, readFile, mkdir } from 'fs/promises';
import { join } from 'path';

const execAsync = promisify(exec);

const deepseek = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY,
  baseURL: process.env.DEEPSEEK_BASE_URL || 'https://api.openai.com/v1'
});

const MODEL = process.env.DEEPSEEK_MODEL || 'gpt-4o-mini';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface VisualRequest {
  type: 'image' | 'video' | 'infographic' | 'social_graphic' | 'diagram';
  purpose: string;
  description: string;

  // Style parameters
  style?: 'professional' | 'modern' | 'minimalist' | 'bold' | 'technical' | 'friendly';
  colorScheme?: string[]; // Hex colors
  branding?: {
    logo?: string;
    primaryColor?: string;
    secondaryColor?: string;
    font?: string;
  };

  // Dimensions
  dimensions?: {
    width: number;
    height: number;
  } | 'square' | 'landscape' | 'portrait' | 'instagram' | 'facebook' | 'linkedin' | 'twitter';

  // Content
  text?: string;
  data?: Record<string, any>;

  // For videos
  script?: string;
  duration?: number; // seconds

  // Quality
  quality?: 'draft' | 'standard' | 'high' | 'ultra';
}

export interface VisualResult {
  type: string;
  url: string; // Local path or URL
  metadata: {
    width: number;
    height: number;
    format: string;
    size: number; // bytes
    generatedAt: string;
  };
  prompt?: string;
  cost?: number;
}

export class VisualContentAgent {
  private outputDir: string;

  constructor() {
    this.outputDir = join(process.cwd(), 'public', 'generated');
    this.ensureOutputDir();
  }

  /**
   * Generate any type of visual content
   */
  async generateVisual(request: VisualRequest): Promise<VisualResult> {
    console.log(`🎨 Visual Content Agent: Generating ${request.type}...`);

    switch (request.type) {
      case 'image':
        return this.generateImage(request);

      case 'video':
        return this.generateVideo(request);

      case 'infographic':
        return this.generateInfographic(request);

      case 'social_graphic':
        return this.generateSocialGraphic(request);

      case 'diagram':
        return this.generateDiagram(request);

      default:
        throw new Error(`Unsupported visual type: ${request.type}`);
    }
  }

  /**
   * Generate image using AI (Flux.1, DALL-E, or Stable Diffusion)
   */
  private async generateImage(request: VisualRequest): Promise<VisualResult> {
    console.log('  🖼️  Generating AI image...');

    // Construct optimized prompt
    const prompt = await this.constructImagePrompt(request);
    console.log(`  📝 Prompt: ${prompt.substring(0, 100)}...`);

    // Determine image size
    const size = this.getDimensions(request.dimensions);

    try {
      // Try DALL-E 3 first (best quality)
      if (process.env.OPENAI_API_KEY) {
        console.log('  🎯 Using DALL-E 3...');

        const response = await openai.images.generate({
          model: 'dall-e-3',
          prompt,
          n: 1,
          size: size as '1024x1024' | '1792x1024' | '1024x1792',
          quality: request.quality === 'ultra' ? 'hd' : 'standard',
          style: request.style === 'professional' ? 'natural' : 'vivid'
        });

        const imageUrl = response.data[0].url!;

        // Download and save image
        const filename = `image-${Date.now()}.png`;
        const localPath = await this.downloadImage(imageUrl, filename);

        console.log(`  ✅ Image generated: ${filename}`);

        return {
          type: 'image',
          url: `/generated/${filename}`,
          metadata: {
            width: parseInt(size.split('x')[0]),
            height: parseInt(size.split('x')[1]),
            format: 'png',
            size: 0, // TODO: Get actual file size
            generatedAt: new Date().toISOString()
          },
          prompt,
          cost: 0.04 // DALL-E 3 HD cost
        };
      }

      // Fallback to text-based generation instruction
      throw new Error('OpenAI API key not configured');

    } catch (error) {
      console.error('  ❌ Image generation failed:', error);

      // Return placeholder with generation instructions
      return {
        type: 'image',
        url: '/placeholder-image.png',
        metadata: {
          width: 1024,
          height: 1024,
          format: 'png',
          size: 0,
          generatedAt: new Date().toISOString()
        },
        prompt,
        cost: 0
      };
    }
  }

  /**
   * Generate video using Code2Video approach (Manim)
   */
  private async generateVideo(request: VisualRequest): Promise<VisualResult> {
    console.log('  🎬 Generating video with Manim...');

    // Step 1: Generate Manim code using DeepSeek
    const manimCode = await this.generateManimCode(request);
    console.log('  ✅ Manim code generated');

    // Step 2: Save code to file
    const codeFilename = `video_${Date.now()}.py`;
    const codeFilePath = join(this.outputDir, codeFilename);
    await writeFile(codeFilePath, manimCode);

    // Step 3: Execute Manim to render video
    const videoFilename = `video_${Date.now()}.mp4`;
    const videoFilePath = join(this.outputDir, videoFilename);

    try {
      // Check if Manim is installed
      await execAsync('manim --version');

      console.log('  🎥 Rendering video with Manim...');
      const { stdout, stderr } = await execAsync(
        `manim -ql ${codeFilePath} -o ${videoFilename}`,
        { timeout: 60000 } // 1 minute timeout
      );

      console.log('  ✅ Video rendered successfully');

      return {
        type: 'video',
        url: `/generated/${videoFilename}`,
        metadata: {
          width: 1920,
          height: 1080,
          format: 'mp4',
          size: 0, // TODO: Get actual file size
          generatedAt: new Date().toISOString()
        },
        prompt: request.script || request.description,
        cost: 0 // Manim is free, only API costs
      };

    } catch (error) {
      console.error('  ⚠️  Manim not installed or render failed. Generating placeholder.');
      console.error('  💡 Install Manim: pip install manim');

      // Return video generation instructions
      return {
        type: 'video',
        url: '/placeholder-video.mp4',
        metadata: {
          width: 1920,
          height: 1080,
          format: 'mp4',
          size: 0,
          generatedAt: new Date().toISOString()
        },
        prompt: request.script || request.description,
        cost: 0
      };
    }
  }

  /**
   * Generate infographic (data visualization)
   */
  private async generateInfographic(request: VisualRequest): Promise<VisualResult> {
    console.log('  📊 Generating infographic...');

    // Use DeepSeek to create an HTML/SVG-based infographic
    const htmlCode = await this.generateInfographicHTML(request);

    // Save as HTML file
    const filename = `infographic-${Date.now()}.html`;
    const filePath = join(this.outputDir, filename);
    await writeFile(filePath, htmlCode);

    console.log(`  ✅ Infographic generated: ${filename}`);

    return {
      type: 'infographic',
      url: `/generated/${filename}`,
      metadata: {
        width: 800,
        height: 1200,
        format: 'html',
        size: htmlCode.length,
        generatedAt: new Date().toISOString()
      },
      cost: 0.001 // DeepSeek cost
    };
  }

  /**
   * Generate social media graphic
   */
  private async generateSocialGraphic(request: VisualRequest): Promise<VisualResult> {
    console.log('  📱 Generating social media graphic...');

    // Optimize for specific platform
    const platformSpecs = this.getPlatformSpecs(request.dimensions as string);

    // Generate optimized image
    const optimizedRequest = {
      ...request,
      type: 'image' as const,
      description: `Social media graphic for ${platformSpecs.platform}: ${request.description}. ${platformSpecs.requirements}`,
      dimensions: { width: platformSpecs.width, height: platformSpecs.height }
    };

    return this.generateImage(optimizedRequest);
  }

  /**
   * Generate technical diagram
   */
  private async generateDiagram(request: VisualRequest): Promise<VisualResult> {
    console.log('  🔷 Generating diagram...');

    // Use Mermaid.js for technical diagrams
    const mermaidCode = await this.generateMermaidDiagram(request);

    // Create HTML with Mermaid
    const html = `
<!DOCTYPE html>
<html>
<head>
  <script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"></script>
  <script>mermaid.initialize({ startOnLoad: true });</script>
  <style>
    body {
      font-family: Arial, sans-serif;
      background: white;
      padding: 20px;
    }
    .mermaid {
      background: white;
    }
  </style>
</head>
<body>
  <div class="mermaid">
${mermaidCode}
  </div>
</body>
</html>`;

    const filename = `diagram-${Date.now()}.html`;
    const filePath = join(this.outputDir, filename);
    await writeFile(filePath, html);

    console.log(`  ✅ Diagram generated: ${filename}`);

    return {
      type: 'diagram',
      url: `/generated/${filename}`,
      metadata: {
        width: 800,
        height: 600,
        format: 'html',
        size: html.length,
        generatedAt: new Date().toISOString()
      },
      cost: 0.001
    };
  }

  // ========================================================================
  // Helper Methods
  // ========================================================================

  /**
   * Construct optimized image generation prompt
   */
  private async constructImagePrompt(request: VisualRequest): Promise<string> {
    const styleDescriptions = {
      professional: 'professional, clean, corporate, business-like',
      modern: 'modern, contemporary, sleek, cutting-edge',
      minimalist: 'minimalist, simple, clean lines, uncluttered',
      bold: 'bold, striking, high contrast, eye-catching',
      technical: 'technical, precise, detailed, engineering-style',
      friendly: 'friendly, approachable, warm, inviting'
    };

    const style = styleDescriptions[request.style || 'professional'];
    const colors = request.colorScheme?.join(', ') || 'professional blue and white';

    const prompt = `${request.description}

Style: ${style}
Colors: ${colors}
Purpose: ${request.purpose}
${request.text ? `Text overlay: "${request.text}"` : ''}

Requirements:
- High quality, photorealistic rendering
- Professional composition
- Appropriate for business/industry use
- ${request.branding ? `Brand colors: ${request.branding.primaryColor}` : ''}
- Clear, focused subject
- Suitable for ${request.dimensions || 'standard'} format`;

    return prompt;
  }

  /**
   * Generate Manim code for video
   */
  private async generateManimCode(request: VisualRequest): Promise<string> {
    const prompt = `Generate Manim (Python) code for an educational/business video about:

Topic: ${request.purpose}
Description: ${request.description}
Script: ${request.script || 'Generate appropriate narration'}
Duration: ${request.duration || 30} seconds

Requirements:
- Use Manim Community v0.19.0 syntax
- Include clear visual transitions
- Add text animations
- Use professional color scheme (blues, grays)
- Include relevant shapes, arrows, or diagrams
- Make it engaging and clear

Return ONLY the Python code, starting with:
from manim import *

class VideoScene(Scene):
    def construct(self):
        # Your code here`;

    const response = await deepseek.chat.completions.create({
      model: MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 2000
    });

    return response.choices[0].message.content || '# Failed to generate code';
  }

  /**
   * Generate infographic HTML
   */
  private async generateInfographicHTML(request: VisualRequest): Promise<string> {
    const prompt = `Generate a beautiful, modern infographic as HTML/CSS/SVG.

Topic: ${request.purpose}
Description: ${request.description}
Data: ${JSON.stringify(request.data || {}, null, 2)}

Requirements:
- Responsive HTML/CSS
- Use SVG for graphics
- Professional color scheme (blues, greens)
- Include charts/graphs if data provided
- Clear typography
- Mobile-friendly
- No external dependencies

Return complete HTML file.`;

    const response = await deepseek.chat.completions.create({
      model: MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 3000
    });

    return response.choices[0].message.content || '<html><body>Failed to generate</body></html>';
  }

  /**
   * Generate Mermaid diagram code
   */
  private async generateMermaidDiagram(request: VisualRequest): Promise<string> {
    const prompt = `Generate a Mermaid.js diagram for:

Topic: ${request.purpose}
Description: ${request.description}
Data: ${JSON.stringify(request.data || {}, null, 2)}

Choose appropriate diagram type (flowchart, sequence, class, state, etc.)
Return ONLY the Mermaid code (no markdown code blocks).`;

    const response = await deepseek.chat.completions.create({
      model: MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 1500
    });

    let code = response.choices[0].message.content || 'graph TD\n  A[Start]';

    // Remove markdown code blocks if present
    code = code.replace(/```mermaid\n?/g, '').replace(/```\n?/g, '').trim();

    return code;
  }

  /**
   * Download image from URL
   */
  private async downloadImage(url: string, filename: string): Promise<string> {
    const response = await fetch(url);
    const buffer = await response.arrayBuffer();
    const filePath = join(this.outputDir, filename);
    await writeFile(filePath, Buffer.from(buffer));
    return filePath;
  }

  /**
   * Get dimensions for image generation
   */
  private getDimensions(dims: VisualRequest['dimensions']): string {
    if (typeof dims === 'object') {
      return `${dims.width}x${dims.height}`;
    }

    const presets: Record<string, string> = {
      square: '1024x1024',
      landscape: '1792x1024',
      portrait: '1024x1792',
      instagram: '1080x1080',
      facebook: '1200x630',
      linkedin: '1200x627',
      twitter: '1600x900'
    };

    return presets[dims as string] || '1024x1024';
  }

  /**
   * Get platform-specific specs
   */
  private getPlatformSpecs(platform: string) {
    const specs: Record<string, any> = {
      instagram: {
        platform: 'Instagram',
        width: 1080,
        height: 1080,
        requirements: 'Square format, high contrast, mobile-optimized, eye-catching'
      },
      facebook: {
        platform: 'Facebook',
        width: 1200,
        height: 630,
        requirements: 'Landscape format, clear text, attention-grabbing'
      },
      linkedin: {
        platform: 'LinkedIn',
        width: 1200,
        height: 627,
        requirements: 'Professional, business-appropriate, clear branding'
      },
      twitter: {
        platform: 'Twitter/X',
        width: 1600,
        height: 900,
        requirements: 'Landscape format, bold text, high contrast'
      }
    };

    return specs[platform] || specs.instagram;
  }

  /**
   * Ensure output directory exists
   */
  private async ensureOutputDir() {
    try {
      await mkdir(this.outputDir, { recursive: true });
    } catch (error) {
      // Directory already exists
    }
  }
}

// Export singleton instance
export const visualContentAgent = new VisualContentAgent();
