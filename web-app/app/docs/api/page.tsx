/**
 * API Documentation Page
 * Interactive API explorer using Scalar API Reference
 *
 * Ticket: API-001
 * Author: Orchestra-Coordinator (Agent-Guide)
 * Date: 2025-10-05
 */

import { ApiReference } from '@scalar/api-reference';
import fs from 'fs';
import path from 'path';

export const metadata = {
  title: 'API Documentation | GEO-SEO Domination',
  description: 'Interactive API documentation for the GEO-SEO Domination REST API',
};

export default function ApiDocsPage() {
  // Load OpenAPI spec from file system
  const specPath = path.join(process.cwd(), 'openapi.yaml');
  let spec = '';

  try {
    spec = fs.readFileSync(specPath, 'utf8');
  } catch (error) {
    console.error('Failed to load OpenAPI spec:', error);
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-red-600">Error Loading API Documentation</h1>
        <p className="mt-4 text-gray-600">
          Failed to load OpenAPI specification. Please ensure openapi.yaml exists in the project root.
        </p>
      </div>
    );
  }

  return (
    <div className="h-screen w-full">
      <ApiReference
        configuration={{
          spec: {
            content: spec
          },
          theme: 'purple',
          layout: 'modern',
          authentication: {
            preferredSecurityScheme: 'bearerAuth',
            http: {
              bearer: {
                token: process.env.NEXT_PUBLIC_DEMO_TOKEN || ''
              }
            }
          },
          defaultOpenAllTags: false,
          hiddenClients: [], // Show all HTTP clients (curl, JavaScript, Python, etc.)
          searchHotKey: 'k',
        }}
      />
    </div>
  );
}
