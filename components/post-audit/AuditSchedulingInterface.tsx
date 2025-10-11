'use client';

import { useState, useEffect } from 'react';
import { Calendar, Clock, Play, Pause, Settings, Plus, Trash2, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface AutomationRule {
  id: string;
  rule_name: string;
  description: string;
  trigger_type: 'audit_completed' | 'score_dropped' | 'schedule' | 'manual' | 'webhook';
  trigger_conditions: any;
  auto_create_tasks: boolean;
  auto_execute_tasks: boolean;
  require_approval: boolean;
  task_types_included: string[];
  max_tasks_per_audit: number;
  priority_threshold: 'low' | 'medium' | 'high' | 'critical';
  is_active: boolean;
  created_at: string;
}

interface AuditSchedulingInterfaceProps {
  companyId: string;
}

export function AuditSchedulingInterface({ companyId }: AuditSchedulingInterfaceProps) {
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<AutomationRule | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    rule_name: '',
    description: '',
    trigger_type: 'schedule' as AutomationRule['trigger_type'],
    schedule_cron: '0 2 * * *',
    auto_create_tasks: true,
    auto_execute_tasks: false,
    require_approval: true,
    max_tasks_per_audit: 20,
    priority_threshold: 'medium' as AutomationRule['priority_threshold'],
  });

  useEffect(() => {
    if (companyId) {
      loadRules();
    }
  }, [companyId]);

  const loadRules = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/post-audit/automated-audits?company_id=${companyId}`);
      const data = await res.json();
      setRules(data.rules || []);
    } catch (error) {
      console.error('Failed to load automation rules:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRule = async () => {
    try {
      const payload = {
        company_id: companyId,
        ...formData,
        trigger_conditions: formData.trigger_type === 'schedule'
          ? { schedule_cron: formData.schedule_cron, timezone: 'Australia/Brisbane' }
          : {},
        task_types_included: ['add_h1_tag', 'add_meta_description', 'optimize_images'],
      };

      const res = await fetch('/api/post-audit/automated-audits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setDialogOpen(false);
        await loadRules();
        resetForm();
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to create rule');
      }
    } catch (error) {
      console.error('Failed to create rule:', error);
      alert('Failed to create rule');
    }
  };

  const handleToggleRule = async (rule: AutomationRule) => {
    try {
      const res = await fetch('/api/post-audit/automated-audits', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: rule.id,
          is_active: !rule.is_active,
        }),
      });

      if (res.ok) {
        await loadRules();
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to update rule');
      }
    } catch (error) {
      console.error('Failed to toggle rule:', error);
      alert('Failed to update rule');
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    if (!confirm('Are you sure you want to delete this automation rule?')) {
      return;
    }

    try {
      const res = await fetch(`/api/post-audit/automated-audits?id=${ruleId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        await loadRules();
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to delete rule');
      }
    } catch (error) {
      console.error('Failed to delete rule:', error);
      alert('Failed to delete rule');
    }
  };

  const resetForm = () => {
    setFormData({
      rule_name: '',
      description: '',
      trigger_type: 'schedule',
      schedule_cron: '0 2 * * *',
      auto_create_tasks: true,
      auto_execute_tasks: false,
      require_approval: true,
      max_tasks_per_audit: 20,
      priority_threshold: 'medium',
    });
    setEditingRule(null);
  };

  const getTriggerIcon = (type: string) => {
    switch (type) {
      case 'schedule':
        return <Clock className="w-4 h-4" />;
      case 'audit_completed':
        return <Calendar className="w-4 h-4" />;
      case 'score_dropped':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Settings className="w-4 h-4" />;
    }
  };

  const getTriggerLabel = (type: string) => {
    const labels: Record<string, string> = {
      schedule: 'Scheduled',
      audit_completed: 'After Audit',
      score_dropped: 'Score Drop',
      manual: 'Manual',
      webhook: 'Webhook',
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-64 mt-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-16 w-full" />
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
          <h2 className="text-2xl font-bold text-gray-900">Audit Scheduling</h2>
          <p className="text-sm text-gray-500 mt-1">
            Configure automated audit rules and task generation
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="w-4 h-4 mr-2" />
              New Rule
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Create Automation Rule</DialogTitle>
              <DialogDescription>
                Configure when and how audits should be triggered and tasks created.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Rule Name */}
              <div className="space-y-2">
                <Label htmlFor="rule_name">Rule Name</Label>
                <Input
                  id="rule_name"
                  value={formData.rule_name}
                  onChange={(e) => setFormData({ ...formData, rule_name: e.target.value })}
                  placeholder="e.g., Daily SEO Audit"
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe what this rule does..."
                  rows={3}
                />
              </div>

              {/* Trigger Type */}
              <div className="space-y-2">
                <Label htmlFor="trigger_type">Trigger Type</Label>
                <Select
                  value={formData.trigger_type}
                  onValueChange={(value: any) => setFormData({ ...formData, trigger_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="schedule">Scheduled (Cron)</SelectItem>
                    <SelectItem value="audit_completed">After Audit Completes</SelectItem>
                    <SelectItem value="score_dropped">When Score Drops</SelectItem>
                    <SelectItem value="manual">Manual Trigger</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Cron Schedule (only for schedule trigger) */}
              {formData.trigger_type === 'schedule' && (
                <div className="space-y-2">
                  <Label htmlFor="schedule_cron">Cron Schedule</Label>
                  <Input
                    id="schedule_cron"
                    value={formData.schedule_cron}
                    onChange={(e) => setFormData({ ...formData, schedule_cron: e.target.value })}
                    placeholder="0 2 * * *"
                  />
                  <p className="text-xs text-gray-500">
                    Examples: "0 2 * * *" (daily at 2am), "0 */6 * * *" (every 6 hours)
                  </p>
                </div>
              )}

              {/* Options */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="auto_create_tasks" className="cursor-pointer">
                    Auto-create tasks
                  </Label>
                  <Switch
                    id="auto_create_tasks"
                    checked={formData.auto_create_tasks}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, auto_create_tasks: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="auto_execute_tasks" className="cursor-pointer">
                    Auto-execute tasks
                  </Label>
                  <Switch
                    id="auto_execute_tasks"
                    checked={formData.auto_execute_tasks}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, auto_execute_tasks: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="require_approval" className="cursor-pointer">
                    Require approval
                  </Label>
                  <Switch
                    id="require_approval"
                    checked={formData.require_approval}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, require_approval: checked })
                    }
                  />
                </div>
              </div>

              {/* Priority Threshold */}
              <div className="space-y-2">
                <Label htmlFor="priority_threshold">Priority Threshold</Label>
                <Select
                  value={formData.priority_threshold}
                  onValueChange={(value: any) =>
                    setFormData({ ...formData, priority_threshold: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Max Tasks */}
              <div className="space-y-2">
                <Label htmlFor="max_tasks">Max Tasks Per Audit</Label>
                <Input
                  id="max_tasks"
                  type="number"
                  value={formData.max_tasks_per_audit}
                  onChange={(e) =>
                    setFormData({ ...formData, max_tasks_per_audit: parseInt(e.target.value) })
                  }
                  min={1}
                  max={100}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateRule} disabled={!formData.rule_name}>
                Create Rule
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Rules List */}
      {rules.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="w-12 h-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Automation Rules</h3>
            <p className="text-sm text-gray-500 text-center max-w-md mb-6">
              Create automation rules to schedule audits and automatically generate tasks based on
              audit results.
            </p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create First Rule
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {rules.map((rule) => (
            <Card
              key={rule.id}
              className={rule.is_active ? 'border-emerald-200' : 'border-gray-200 opacity-60'}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-lg">{rule.rule_name}</CardTitle>
                      <Badge variant={rule.is_active ? 'default' : 'secondary'}>
                        {rule.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                      <Badge variant="outline" className="gap-1">
                        {getTriggerIcon(rule.trigger_type)}
                        {getTriggerLabel(rule.trigger_type)}
                      </Badge>
                    </div>
                    <CardDescription>{rule.description}</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={rule.is_active}
                      onCheckedChange={() => handleToggleRule(rule)}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteRule(rule.id)}
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Auto-create tasks</span>
                    <p className="font-medium">
                      {rule.auto_create_tasks ? 'Yes' : 'No'}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">Auto-execute</span>
                    <p className="font-medium">
                      {rule.auto_execute_tasks ? 'Yes' : 'No'}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">Requires approval</span>
                    <p className="font-medium">
                      {rule.require_approval ? 'Yes' : 'No'}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">Max tasks</span>
                    <p className="font-medium">{rule.max_tasks_per_audit}</p>
                  </div>
                </div>

                {rule.trigger_type === 'schedule' && rule.trigger_conditions?.schedule_cron && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <span className="text-sm text-gray-500">Schedule: </span>
                    <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                      {rule.trigger_conditions.schedule_cron}
                    </code>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
