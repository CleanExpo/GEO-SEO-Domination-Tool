'use client';

import { useState, useEffect } from 'react';
import { Key, Plus, Eye, EyeOff, Shield, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface WebsiteCredentials {
  id: string;
  company_id: string;
  platform_type: string;
  platform_version: string;
  primary_access_method: string;
  test_connection_status: string;
  is_active: boolean;
  notes: string;
  created_at: string;
  last_verified_at?: string;

  // Platform-specific fields
  wp_url?: string;
  wp_username?: string;
  github_repo?: string;
  github_branch?: string;
  shopify_store_url?: string;
  vercel_project_id?: string;
  ftp_host?: string;
  ftp_port?: number;
  ssh_host?: string;
  ssh_port?: number;
}

interface ApiCredentialsManagerProps {
  companyId: string;
}

export function ApiCredentialsManager({ companyId }: ApiCredentialsManagerProps) {
  const [credentials, setCredentials] = useState<WebsiteCredentials[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});

  // Form state
  const [formData, setFormData] = useState({
    platform_type: 'wordpress',
    primary_access_method: 'wp_rest_api',
    platform_version: '',
    wp_url: '',
    wp_username: '',
    wp_app_password: '',
    github_repo: '',
    github_token: '',
    github_branch: 'main',
    github_auto_pr: true,
    vercel_project_id: '',
    vercel_token: '',
    shopify_store_url: '',
    shopify_access_token: '',
    ftp_host: '',
    ftp_port: 21,
    ftp_username: '',
    ftp_password: '',
    notes: '',
  });

  useEffect(() => {
    if (companyId) {
      loadCredentials();
    }
  }, [companyId]);

  const loadCredentials = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/post-audit/api-credentials?company_id=${companyId}`);
      const data = await res.json();
      setCredentials(data.credentials || []);
    } catch (error) {
      console.error('Failed to load credentials:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCredentials = async () => {
    try {
      const payload = {
        company_id: companyId,
        ...formData,
      };

      const res = await fetch('/api/post-audit/api-credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setDialogOpen(false);
        await loadCredentials();
        resetForm();
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to save credentials');
      }
    } catch (error) {
      console.error('Failed to save credentials:', error);
      alert('Failed to save credentials');
    }
  };

  const handleDeleteCredentials = async (id: string) => {
    if (!confirm('Are you sure you want to delete these credentials?')) {
      return;
    }

    try {
      const res = await fetch(`/api/post-audit/api-credentials?id=${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        await loadCredentials();
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to delete credentials');
      }
    } catch (error) {
      console.error('Failed to delete credentials:', error);
      alert('Failed to delete credentials');
    }
  };

  const resetForm = () => {
    setFormData({
      platform_type: 'wordpress',
      primary_access_method: 'wp_rest_api',
      platform_version: '',
      wp_url: '',
      wp_username: '',
      wp_app_password: '',
      github_repo: '',
      github_token: '',
      github_branch: 'main',
      github_auto_pr: true,
      vercel_project_id: '',
      vercel_token: '',
      shopify_store_url: '',
      shopify_access_token: '',
      ftp_host: '',
      ftp_port: 21,
      ftp_username: '',
      ftp_password: '',
      notes: '',
    });
  };

  const getPlatformIcon = (platform: string) => {
    // You can replace with actual platform logos
    return <Shield className="w-5 h-5" />;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Verified
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="destructive">
            <XCircle className="w-3 h-3 mr-1" />
            Failed
          </Badge>
        );
      default:
        return <Badge variant="outline">Untested</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4">
          {[1, 2].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-64 mt-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">API Credentials</h2>
          <p className="text-sm text-gray-500 mt-1">
            Securely store website access credentials for automated tasks
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="w-4 h-4 mr-2" />
              Add Credentials
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Website Credentials</DialogTitle>
              <DialogDescription>
                Configure access credentials for automated website modifications.
                All sensitive data is encrypted.
              </DialogDescription>
            </DialogHeader>

            <Tabs defaultValue="wordpress" className="mt-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger
                  value="wordpress"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      platform_type: 'wordpress',
                      primary_access_method: 'wp_rest_api',
                    })
                  }
                >
                  WordPress
                </TabsTrigger>
                <TabsTrigger
                  value="shopify"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      platform_type: 'shopify',
                      primary_access_method: 'shopify_api',
                    })
                  }
                >
                  Shopify
                </TabsTrigger>
                <TabsTrigger
                  value="next"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      platform_type: 'next',
                      primary_access_method: 'github',
                    })
                  }
                >
                  Next.js
                </TabsTrigger>
              </TabsList>

              <TabsContent value="wordpress" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="wp_url">WordPress URL</Label>
                  <Input
                    id="wp_url"
                    type="url"
                    value={formData.wp_url}
                    onChange={(e) => setFormData({ ...formData, wp_url: e.target.value })}
                    placeholder="https://example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="wp_username">Username</Label>
                  <Input
                    id="wp_username"
                    value={formData.wp_username}
                    onChange={(e) => setFormData({ ...formData, wp_username: e.target.value })}
                    placeholder="admin"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="wp_app_password">Application Password</Label>
                  <Input
                    id="wp_app_password"
                    type="password"
                    value={formData.wp_app_password}
                    onChange={(e) => setFormData({ ...formData, wp_app_password: e.target.value })}
                    placeholder="xxxx xxxx xxxx xxxx xxxx xxxx"
                  />
                  <p className="text-xs text-gray-500">
                    Generate from WordPress Users → Profile → Application Passwords
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="shopify" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="shopify_store_url">Store URL</Label>
                  <Input
                    id="shopify_store_url"
                    value={formData.shopify_store_url}
                    onChange={(e) => setFormData({ ...formData, shopify_store_url: e.target.value })}
                    placeholder="mystore.myshopify.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="shopify_access_token">Admin API Access Token</Label>
                  <Input
                    id="shopify_access_token"
                    type="password"
                    value={formData.shopify_access_token}
                    onChange={(e) =>
                      setFormData({ ...formData, shopify_access_token: e.target.value })
                    }
                    placeholder="shpat_..."
                  />
                  <p className="text-xs text-gray-500">
                    Generate from Shopify Admin → Apps → Develop Apps
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="next" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="github_repo">GitHub Repository</Label>
                  <Input
                    id="github_repo"
                    value={formData.github_repo}
                    onChange={(e) => setFormData({ ...formData, github_repo: e.target.value })}
                    placeholder="username/repository"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="github_token">GitHub Personal Access Token</Label>
                  <Input
                    id="github_token"
                    type="password"
                    value={formData.github_token}
                    onChange={(e) => setFormData({ ...formData, github_token: e.target.value })}
                    placeholder="ghp_..."
                  />
                  <p className="text-xs text-gray-500">
                    Generate from GitHub Settings → Developer settings → Personal access tokens
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vercel_project_id">Vercel Project ID</Label>
                  <Input
                    id="vercel_project_id"
                    value={formData.vercel_project_id}
                    onChange={(e) => setFormData({ ...formData, vercel_project_id: e.target.value })}
                    placeholder="prj_..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vercel_token">Vercel Token</Label>
                  <Input
                    id="vercel_token"
                    type="password"
                    value={formData.vercel_token}
                    onChange={(e) => setFormData({ ...formData, vercel_token: e.target.value })}
                    placeholder="..."
                  />
                </div>
              </TabsContent>
            </Tabs>

            <div className="space-y-2 mt-4">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes about these credentials..."
                rows={3}
              />
            </div>

            <DialogFooter className="mt-6">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveCredentials}>Save Credentials</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Credentials List */}
      {credentials.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Key className="w-12 h-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Credentials Stored</h3>
            <p className="text-sm text-gray-500 text-center max-w-md mb-6">
              Add website credentials to enable automated post-audit fixes and modifications.
            </p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add First Credentials
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {credentials.map((cred) => (
            <Card key={cred.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    {getPlatformIcon(cred.platform_type)}
                    <div className="flex-1">
                      <CardTitle className="text-lg capitalize">
                        {cred.platform_type} Access
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {cred.primary_access_method.replace(/_/g, ' ')}
                        {cred.platform_version && ` • ${cred.platform_version}`}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(cred.test_connection_status)}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteCredentials(cred.id)}
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                {/* Platform-specific details */}
                {cred.platform_type === 'wordpress' && cred.wp_url && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">URL:</span>
                    <span className="font-medium">{cred.wp_url}</span>
                  </div>
                )}

                {cred.platform_type === 'shopify' && cred.shopify_store_url && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Store:</span>
                    <span className="font-medium">{cred.shopify_store_url}</span>
                  </div>
                )}

                {cred.platform_type === 'next' && cred.github_repo && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Repository:</span>
                    <span className="font-medium">{cred.github_repo}</span>
                  </div>
                )}

                {cred.notes && (
                  <div className="pt-2 border-t border-gray-200">
                    <p className="text-sm text-gray-600">{cred.notes}</p>
                  </div>
                )}

                <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-200">
                  <span>Added: {new Date(cred.created_at).toLocaleDateString()}</span>
                  {cred.last_verified_at && (
                    <span>
                      Last verified: {new Date(cred.last_verified_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
