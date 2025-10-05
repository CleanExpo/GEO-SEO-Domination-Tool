/**
 * Theme Customiser Component
 * Interactive UI for configuring organisation white-label theming
 * Phase 3: THEME-001
 */

'use client';

import React, { useState } from 'react';
import { OrganisationTheme, ThemeUpdateInput, isValidHexColour } from '@/services/theme-manager';
import { ThemePreview } from './theme-provider';

// ============================================================
// TYPES
// ============================================================

interface ThemeCustomiserProps {
  organisationId: string;
  currentTheme: OrganisationTheme;
  onThemeUpdate?: (theme: OrganisationTheme) => void;
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export function ThemeCustomiser({ organisationId, currentTheme, onThemeUpdate }: ThemeCustomiserProps) {
  const [previewTheme, setPreviewTheme] = useState<OrganisationTheme>(currentTheme);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // ============================================================
  // COLOUR PICKERS
  // ============================================================

  const handleColourChange = (field: 'primaryColour' | 'secondaryColour' | 'accentColour', value: string) => {
    if (isValidHexColour(value)) {
      setPreviewTheme((prev) => ({ ...prev, [field]: value }));
      setError(null);
    } else {
      setError(`Invalid hex colour: ${value}`);
    }
  };

  // ============================================================
  // FILE UPLOADS
  // ============================================================

  const handleFileUpload = async (file: File, type: 'logo' | 'logo-dark' | 'favicon') => {
    setIsUploading(true);
    setError(null);

    try {
      // Create form data
      const formData = new FormData();
      formData.append('file', file);
      formData.append('organisationId', organisationId);
      formData.append('type', type);

      // Upload via API route
      const response = await fetch('/api/themes/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const { url } = await response.json();

      // Update preview
      const fieldMap = {
        logo: 'logoUrl',
        'logo-dark': 'logoDarkUrl',
        favicon: 'faviconUrl',
      };

      setPreviewTheme((prev) => ({
        ...prev,
        [fieldMap[type]]: url,
      }));

      setSuccessMessage(`${type} uploaded successfully`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError(`Upload failed: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  // ============================================================
  // SAVE THEME
  // ============================================================

  const handleSaveTheme = async () => {
    setIsSaving(true);
    setError(null);

    try {
      const updates: ThemeUpdateInput = {
        primaryColour: previewTheme.primaryColour,
        secondaryColour: previewTheme.secondaryColour,
        accentColour: previewTheme.accentColour,
        logoUrl: previewTheme.logoUrl,
        logoDarkUrl: previewTheme.logoDarkUrl,
        faviconUrl: previewTheme.faviconUrl,
        fontFamily: previewTheme.fontFamily,
        headingFontFamily: previewTheme.headingFontFamily,
        borderRadius: previewTheme.borderRadius,
        customDomain: previewTheme.customDomain,
      };

      const response = await fetch('/api/themes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organisationId, updates }),
      });

      if (!response.ok) {
        throw new Error('Failed to save theme');
      }

      const { theme } = await response.json();

      setSuccessMessage('Theme saved successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);

      if (onThemeUpdate) {
        onThemeUpdate(theme);
      }

      // Reload page to apply new theme
      setTimeout(() => window.location.reload(), 1500);
    } catch (err: any) {
      setError(`Save failed: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // ============================================================
  // RESET THEME
  // ============================================================

  const handleResetTheme = async () => {
    if (!confirm('Are you sure you want to reset the theme to defaults? This action cannot be undone.')) {
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch('/api/themes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organisationId, action: 'reset' }),
      });

      if (!response.ok) {
        throw new Error('Failed to reset theme');
      }

      const { theme } = await response.json();

      setPreviewTheme(theme);
      setSuccessMessage('Theme reset to defaults');
      setTimeout(() => setSuccessMessage(null), 3000);

      if (onThemeUpdate) {
        onThemeUpdate(theme);
      }

      // Reload page
      setTimeout(() => window.location.reload(), 1500);
    } catch (err: any) {
      setError(`Reset failed: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="theme-customiser grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Configuration Panel */}
      <div className="config-panel space-y-6">
        <h2 className="text-2xl font-bold">Theme Customisation</h2>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded">
            {successMessage}
          </div>
        )}

        {/* Colour Scheme */}
        <section className="space-y-4">
          <h3 className="text-lg font-semibold">Colour Scheme</h3>

          <ColourPicker
            label="Primary Colour"
            value={previewTheme.primaryColour}
            onChange={(val) => handleColourChange('primaryColour', val)}
          />

          <ColourPicker
            label="Secondary Colour"
            value={previewTheme.secondaryColour}
            onChange={(val) => handleColourChange('secondaryColour', val)}
          />

          <ColourPicker
            label="Accent Colour"
            value={previewTheme.accentColour}
            onChange={(val) => handleColourChange('accentColour', val)}
          />
        </section>

        {/* Brand Assets */}
        <section className="space-y-4">
          <h3 className="text-lg font-semibold">Brand Assets</h3>

          <FileUploadField
            label="Logo (Light Mode)"
            currentUrl={previewTheme.logoUrl}
            onUpload={(file) => handleFileUpload(file, 'logo')}
            isUploading={isUploading}
          />

          <FileUploadField
            label="Logo (Dark Mode)"
            currentUrl={previewTheme.logoDarkUrl}
            onUpload={(file) => handleFileUpload(file, 'logo-dark')}
            isUploading={isUploading}
          />

          <FileUploadField
            label="Favicon"
            currentUrl={previewTheme.faviconUrl}
            onUpload={(file) => handleFileUpload(file, 'favicon')}
            isUploading={isUploading}
            accept=".ico,.png,.svg"
          />
        </section>

        {/* Typography */}
        <section className="space-y-4">
          <h3 className="text-lg font-semibold">Typography</h3>

          <div>
            <label className="block text-sm font-medium mb-2">Font Family</label>
            <select
              value={previewTheme.fontFamily}
              onChange={(e) => setPreviewTheme((prev) => ({ ...prev, fontFamily: e.target.value }))}
              className="w-full px-3 py-2 border rounded"
            >
              <option value="Inter">Inter</option>
              <option value="Roboto">Roboto</option>
              <option value="Open Sans">Open Sans</option>
              <option value="Poppins">Poppins</option>
              <option value="Lato">Lato</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Border Radius</label>
            <select
              value={previewTheme.borderRadius}
              onChange={(e) => setPreviewTheme((prev) => ({ ...prev, borderRadius: e.target.value as any }))}
              className="w-full px-3 py-2 border rounded"
            >
              <option value="none">None</option>
              <option value="sm">Small</option>
              <option value="md">Medium</option>
              <option value="lg">Large</option>
              <option value="xl">Extra Large</option>
            </select>
          </div>
        </section>

        {/* Actions */}
        <div className="flex gap-4 pt-4">
          <button
            onClick={handleSaveTheme}
            disabled={isSaving}
            className="flex-1 bg-primary text-white px-6 py-3 rounded font-medium hover:opacity-90 disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save Theme'}
          </button>

          <button
            onClick={handleResetTheme}
            disabled={isSaving}
            className="px-6 py-3 border rounded font-medium hover:bg-gray-50 disabled:opacity-50"
          >
            Reset to Defaults
          </button>
        </div>
      </div>

      {/* Preview Panel */}
      <div className="preview-panel">
        <h2 className="text-2xl font-bold mb-4">Preview</h2>

        <ThemePreview theme={previewTheme}>
          <div className="border rounded-lg p-6 space-y-4">
            <div className="space-y-2">
              <h3 className="text-xl font-bold">Sample Heading</h3>
              <p className="text-gray-600">This is how your themed content will look.</p>
            </div>

            <div className="flex gap-2">
              <button className="bg-primary text-white px-4 py-2 rounded">Primary Button</button>
              <button className="bg-secondary text-white px-4 py-2 rounded">Secondary Button</button>
              <button className="bg-accent text-white px-4 py-2 rounded">Accent Button</button>
            </div>

            <div className="border rounded p-4">
              <p>Card with custom border radius: {previewTheme.borderRadius}</p>
            </div>
          </div>
        </ThemePreview>
      </div>
    </div>
  );
}

// ============================================================
// SUB-COMPONENTS
// ============================================================

interface ColourPickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

function ColourPicker({ label, value, onChange }: ColourPickerProps) {
  return (
    <div>
      <label className="block text-sm font-medium mb-2">{label}</label>
      <div className="flex gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-20 rounded border cursor-pointer"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          pattern="^#[0-9A-Fa-f]{6}$"
          placeholder="#10b981"
          className="flex-1 px-3 py-2 border rounded font-mono text-sm"
        />
      </div>
    </div>
  );
}

interface FileUploadFieldProps {
  label: string;
  currentUrl?: string;
  onUpload: (file: File) => void;
  isUploading: boolean;
  accept?: string;
}

function FileUploadField({ label, currentUrl, onUpload, isUploading, accept = 'image/*' }: FileUploadFieldProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUpload(file);
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium mb-2">{label}</label>
      <div className="flex items-center gap-4">
        {currentUrl && (
          <img src={currentUrl} alt={label} className="h-12 w-12 object-contain border rounded" />
        )}
        <input
          type="file"
          accept={accept}
          onChange={handleChange}
          disabled={isUploading}
          className="flex-1 text-sm"
        />
      </div>
    </div>
  );
}
