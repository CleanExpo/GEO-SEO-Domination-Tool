#!/bin/bash

# Migrate console.log to Sentry - Automated Script
# Phase 1: Critical errors in services/api/deepseek-*.ts files

echo "🔄 Migrating DeepSeek services console.log to Sentry..."

# Add Sentry import to all deepseek files
for file in services/api/deepseek-*.ts; do
  if [ -f "$file" ]; then
    # Check if Sentry import already exists
    if ! grep -q "import \* as Sentry from '@sentry/nextjs'" "$file"; then
      # Add import after first import statement
      sed -i '1a import * as Sentry from '\''@sentry/nextjs'\''' "$file"
      echo "✅ Added Sentry import to $file"
    fi
  fi
done

echo "✅ Sentry imports added to DeepSeek services"
echo "Next: Manual migration of console.error patterns..."
