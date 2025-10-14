'use client';

/**
 * Website Access Step (Step 5)
 * Collects credentials for website hosting, CMS, FTP, DNS, and database access
 * Part of credential capture system for Complete Ecosystem Management
 */

import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertCircle, Server, Database, Globe, HardDrive, Lock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface FormFieldProps {
  name: string;
  label: string;
  required?: boolean;
  children: React.ReactNode;
}

export function WebsiteAccessStep() {
  const { register, watch, formState: { errors } } = useFormContext();

  // Watch checkbox states to conditionally show credential fields
  const hasHostingAccess = watch('websiteAccess.hasHostingAccess');
  const hasCmsAccess = watch('websiteAccess.hasCmsAccess');
  const hasFtpAccess = watch('websiteAccess.hasFtpAccess');
  const hasDnsAccess = watch('websiteAccess.hasDnsAccess');
  const hasDatabaseAccess = watch('websiteAccess.hasDatabaseAccess');

  const FormField = ({ name, label, required = false, children }: FormFieldProps) => {
    const error = errors.websiteAccess?.[name.split('.').pop() as string];

    return (
      <div className="space-y-2">
        <Label htmlFor={name} className="flex items-center gap-1">
          {label}
          {required && <span className="text-red-500">*</span>}
        </Label>
        {children}
        {error && (
          <div className="flex items-center gap-1 text-sm text-red-500">
            <AlertCircle className="h-3 w-3" />
            <span>{error.message as string}</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Security Notice */}
      <Card className="bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <CardTitle className="text-base text-blue-900 dark:text-blue-100">
              Secure Credential Storage
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="text-sm text-blue-800 dark:text-blue-200">
          <p>
            All credentials are encrypted with AES-256-GCM encryption and stored securely.
            We use these credentials to automatically implement fixes and improvements to your website.
          </p>
          <p className="mt-2 font-medium">
            ✓ Military-grade encryption  ✓ Complete audit trail  ✓ You control permissions
          </p>
        </CardContent>
      </Card>

      {/* Hosting Access */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              <CardTitle className="text-lg">Hosting Access</CardTitle>
            </div>
            <Badge variant="secondary">Optional</Badge>
          </div>
          <CardDescription>
            Provide access to your hosting control panel (cPanel, Plesk, etc.)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="hasHostingAccess"
              {...register('websiteAccess.hasHostingAccess')}
            />
            <label
              htmlFor="hasHostingAccess"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              I have hosting access credentials
            </label>
          </div>

          {hasHostingAccess && (
            <div className="space-y-4 pl-6 border-l-2 border-emerald-200 dark:border-emerald-800 ml-2">
              <FormField name="websiteAccess.hostingProvider" label="Hosting Provider">
                <Input
                  {...register('websiteAccess.hostingProvider')}
                  placeholder="e.g., SiteGround, Bluehost, HostGator"
                />
              </FormField>

              <FormField name="websiteAccess.hostingControlPanel" label="Control Panel Type">
                <Input
                  {...register('websiteAccess.hostingControlPanel')}
                  placeholder="e.g., cPanel, Plesk, Custom"
                />
              </FormField>

              <FormField name="websiteAccess.hostingUrl" label="Control Panel URL">
                <Input
                  {...register('websiteAccess.hostingUrl')}
                  type="url"
                  placeholder="https://cpanel.example.com"
                />
              </FormField>

              <FormField name="websiteAccess.hostingUsername" label="Username">
                <Input
                  {...register('websiteAccess.hostingUsername')}
                  placeholder="Your hosting username"
                  autoComplete="username"
                />
              </FormField>

              <FormField name="websiteAccess.hostingPassword" label="Password">
                <Input
                  {...register('websiteAccess.hostingPassword')}
                  type="password"
                  placeholder="Your hosting password"
                  autoComplete="current-password"
                />
              </FormField>
            </div>
          )}
        </CardContent>
      </Card>

      {/* CMS Access */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              <CardTitle className="text-lg">CMS Admin Access</CardTitle>
            </div>
            <Badge variant="secondary">Optional</Badge>
          </div>
          <CardDescription>
            WordPress, Shopify, Wix, or custom CMS administrator credentials
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="hasCmsAccess"
              {...register('websiteAccess.hasCmsAccess')}
            />
            <label
              htmlFor="hasCmsAccess"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              I have CMS admin credentials
            </label>
          </div>

          {hasCmsAccess && (
            <div className="space-y-4 pl-6 border-l-2 border-emerald-200 dark:border-emerald-800 ml-2">
              <FormField name="websiteAccess.cmsType" label="CMS Platform">
                <Input
                  {...register('websiteAccess.cmsType')}
                  placeholder="e.g., WordPress, Shopify, Wix, Custom"
                />
              </FormField>

              <FormField name="websiteAccess.cmsVersion" label="CMS Version">
                <Input
                  {...register('websiteAccess.cmsVersion')}
                  placeholder="e.g., 6.4.2"
                />
              </FormField>

              <FormField name="websiteAccess.cmsAdminUrl" label="Admin Login URL">
                <Input
                  {...register('websiteAccess.cmsAdminUrl')}
                  type="url"
                  placeholder="https://example.com/wp-admin or /admin"
                />
              </FormField>

              <FormField name="websiteAccess.cmsUsername" label="Admin Username">
                <Input
                  {...register('websiteAccess.cmsUsername')}
                  placeholder="Your CMS admin username"
                  autoComplete="username"
                />
              </FormField>

              <FormField name="websiteAccess.cmsPassword" label="Admin Password">
                <Input
                  {...register('websiteAccess.cmsPassword')}
                  type="password"
                  placeholder="Your CMS admin password"
                  autoComplete="current-password"
                />
              </FormField>
            </div>
          )}
        </CardContent>
      </Card>

      {/* FTP/SFTP Access */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HardDrive className="h-5 w-5" />
              <CardTitle className="text-lg">FTP/SFTP Access</CardTitle>
            </div>
            <Badge variant="secondary">Optional</Badge>
          </div>
          <CardDescription>
            Direct file system access via FTP or SFTP for file management
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="hasFtpAccess"
              {...register('websiteAccess.hasFtpAccess')}
            />
            <label
              htmlFor="hasFtpAccess"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              I have FTP/SFTP credentials
            </label>
          </div>

          {hasFtpAccess && (
            <div className="space-y-4 pl-6 border-l-2 border-emerald-200 dark:border-emerald-800 ml-2">
              <FormField name="websiteAccess.ftpHost" label="FTP Host">
                <Input
                  {...register('websiteAccess.ftpHost')}
                  placeholder="ftp.example.com"
                />
              </FormField>

              <FormField name="websiteAccess.ftpPort" label="FTP Port">
                <Input
                  {...register('websiteAccess.ftpPort')}
                  type="number"
                  placeholder="21 (FTP) or 22 (SFTP)"
                  defaultValue="21"
                />
              </FormField>

              <FormField name="websiteAccess.ftpProtocol" label="Protocol">
                <select
                  {...register('websiteAccess.ftpProtocol')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">Select protocol</option>
                  <option value="ftp">FTP (Standard)</option>
                  <option value="sftp">SFTP (Secure)</option>
                  <option value="ftps">FTPS (FTP over SSL)</option>
                </select>
              </FormField>

              <FormField name="websiteAccess.ftpUsername" label="FTP Username">
                <Input
                  {...register('websiteAccess.ftpUsername')}
                  placeholder="Your FTP username"
                  autoComplete="username"
                />
              </FormField>

              <FormField name="websiteAccess.ftpPassword" label="FTP Password">
                <Input
                  {...register('websiteAccess.ftpPassword')}
                  type="password"
                  placeholder="Your FTP password"
                  autoComplete="current-password"
                />
              </FormField>
            </div>
          )}
        </CardContent>
      </Card>

      {/* DNS Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              <CardTitle className="text-lg">DNS Management</CardTitle>
            </div>
            <Badge variant="secondary">Optional</Badge>
          </div>
          <CardDescription>
            Access to your domain registrar or DNS provider (Cloudflare, GoDaddy, etc.)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="hasDnsAccess"
              {...register('websiteAccess.hasDnsAccess')}
            />
            <label
              htmlFor="hasDnsAccess"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              I have DNS management credentials
            </label>
          </div>

          {hasDnsAccess && (
            <div className="space-y-4 pl-6 border-l-2 border-emerald-200 dark:border-emerald-800 ml-2">
              <FormField name="websiteAccess.dnsProvider" label="DNS Provider">
                <Input
                  {...register('websiteAccess.dnsProvider')}
                  placeholder="e.g., Cloudflare, GoDaddy, Namecheap"
                />
              </FormField>

              <FormField name="websiteAccess.dnsUsername" label="DNS Account Username/Email">
                <Input
                  {...register('websiteAccess.dnsUsername')}
                  placeholder="Your DNS account username or email"
                  autoComplete="username"
                />
              </FormField>

              <FormField name="websiteAccess.dnsPassword" label="DNS Account Password">
                <Input
                  {...register('websiteAccess.dnsPassword')}
                  type="password"
                  placeholder="Your DNS account password"
                  autoComplete="current-password"
                />
              </FormField>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Database Access */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              <CardTitle className="text-lg">Database Access</CardTitle>
            </div>
            <Badge variant="secondary">Optional</Badge>
          </div>
          <CardDescription>
            Direct database access for advanced optimizations (MySQL, PostgreSQL, etc.)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="hasDatabaseAccess"
              {...register('websiteAccess.hasDatabaseAccess')}
            />
            <label
              htmlFor="hasDatabaseAccess"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              I have database credentials
            </label>
          </div>

          {hasDatabaseAccess && (
            <div className="space-y-4 pl-6 border-l-2 border-emerald-200 dark:border-emerald-800 ml-2">
              <FormField name="websiteAccess.dbType" label="Database Type">
                <select
                  {...register('websiteAccess.dbType')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">Select database type</option>
                  <option value="mysql">MySQL</option>
                  <option value="postgresql">PostgreSQL</option>
                  <option value="mariadb">MariaDB</option>
                  <option value="mongodb">MongoDB</option>
                  <option value="sqlite">SQLite</option>
                </select>
              </FormField>

              <FormField name="websiteAccess.dbHost" label="Database Host">
                <Input
                  {...register('websiteAccess.dbHost')}
                  placeholder="localhost or db.example.com"
                />
              </FormField>

              <FormField name="websiteAccess.dbPort" label="Database Port">
                <Input
                  {...register('websiteAccess.dbPort')}
                  type="number"
                  placeholder="3306 (MySQL) or 5432 (PostgreSQL)"
                />
              </FormField>

              <FormField name="websiteAccess.dbName" label="Database Name">
                <Input
                  {...register('websiteAccess.dbName')}
                  placeholder="Your database name"
                />
              </FormField>

              <FormField name="websiteAccess.dbUsername" label="Database Username">
                <Input
                  {...register('websiteAccess.dbUsername')}
                  placeholder="Your database username"
                  autoComplete="username"
                />
              </FormField>

              <FormField name="websiteAccess.dbPassword" label="Database Password">
                <Input
                  {...register('websiteAccess.dbPassword')}
                  type="password"
                  placeholder="Your database password"
                  autoComplete="current-password"
                />
              </FormField>
            </div>
          )}
        </CardContent>
      </Card>

      {/* What We Can Do */}
      <Card className="bg-emerald-50 border-emerald-200 dark:bg-emerald-950 dark:border-emerald-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-emerald-900 dark:text-emerald-100">
            What We Can Do With This Access
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-emerald-800 dark:text-emerald-200">
          <ul className="space-y-2">
            <li>✓ Automatically fix broken links and 404 errors</li>
            <li>✓ Optimize images for faster loading</li>
            <li>✓ Implement structured data (Schema.org)</li>
            <li>✓ Update meta tags and titles</li>
            <li>✓ Install and configure SEO plugins</li>
            <li>✓ Set up redirects and canonical URLs</li>
            <li>✓ Improve site security (SSL, headers)</li>
            <li>✓ Configure caching and performance</li>
          </ul>
          <p className="mt-4 font-medium">
            You control all permissions and can revoke access anytime from your dashboard.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
