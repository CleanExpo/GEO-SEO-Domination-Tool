import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { apiServices } from '@/lib/services/api-service-manager';
import { envValidator } from '@/lib/config/env-validator';

/**
 * GET /api/health/check - Comprehensive health check endpoint
 * Verifies database connection and all service integrations
 */
export async function GET() {
  const healthCheck = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      database: { status: 'unknown', message: '' },
      lighthouse: { status: 'unknown', configured: false, description: '' },
      firecrawl: { status: 'unknown', configured: false, description: '' },
      anthropic: { status: 'unknown', configured: false, description: '' },
      semrush: { status: 'unknown', configured: false, description: '' },
      perplexity: { status: 'unknown', configured: false, description: '' },
    },
    environment: {
      nodeEnv: process.env.NODE_ENV,
      errors: [] as string[],
      warnings: [] as string[],
    },
  };

  // Check environment configuration
  healthCheck.environment.errors = envValidator.getErrors();
  healthCheck.environment.warnings = envValidator.getWarnings();

  // Check database connection
  try {
    const { data, error } = await supabase.from('companies').select('id').limit(1);
    if (error) {
      healthCheck.services.database.status = 'error';
      healthCheck.services.database.message = error.message;
      healthCheck.status = 'unhealthy';
    } else {
      healthCheck.services.database.status = 'healthy';
      healthCheck.services.database.message = 'Connected to Supabase';
    }
  } catch (error) {
    healthCheck.services.database.status = 'error';
    healthCheck.services.database.message = String(error);
    healthCheck.status = 'unhealthy';
  }

  // Check service availability
  const serviceStatus = apiServices.getServiceStatus();

  healthCheck.services.lighthouse = {
    status: serviceStatus.lighthouse.available ? 'configured' : 'not_configured',
    configured: serviceStatus.lighthouse.available,
    description: serviceStatus.lighthouse.description,
  };

  healthCheck.services.firecrawl = {
    status: serviceStatus.firecrawl.available ? 'configured' : 'not_configured',
    configured: serviceStatus.firecrawl.available,
    description: serviceStatus.firecrawl.description,
  };

  healthCheck.services.anthropic = {
    status: serviceStatus.anthropic.available ? 'configured' : 'not_configured',
    configured: serviceStatus.anthropic.available,
    description: serviceStatus.anthropic.description,
  };

  healthCheck.services.semrush = {
    status: serviceStatus.semrush.available ? 'configured' : 'not_configured',
    configured: serviceStatus.semrush.available,
    description: serviceStatus.semrush.description,
  };

  healthCheck.services.perplexity = {
    status: serviceStatus.perplexity.available ? 'configured' : 'not_configured',
    configured: serviceStatus.perplexity.available,
    description: serviceStatus.perplexity.description,
  };

  return NextResponse.json(healthCheck);
}
