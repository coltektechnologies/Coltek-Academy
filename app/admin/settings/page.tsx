'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Settings, Save, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';

// Form validation schema
const settingsSchema = z.object({
  siteName: z.string().min(2, 'Site name must be at least 2 characters'),
  adminEmail: z.string().email('Please enter a valid email'),
  maintenanceMode: z.boolean().default(false),
  enableRegistration: z.boolean().default(true),
  enableEmailNotifications: z.boolean().default(true),
  maxFileSize: z.number().min(1, 'File size must be at least 1MB').max(50, 'File size cannot exceed 50MB'),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

const defaultValues: Partial<SettingsFormValues> = {
  siteName: 'Coltek Academy',
  adminEmail: 'admin@coltekacademy.com',
  maintenanceMode: false,
  enableRegistration: true,
  enableEmailNotifications: true,
  maxFileSize: 10,
};

export default function SettingsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues,
  });

  useEffect(() => {
    // Simulate loading settings from an API
    const loadSettings = async () => {
      try {
        // In a real app, you would fetch these settings from your backend
        // const response = await fetch('/api/settings');
        // const data = await response.json();
        // form.reset(data);
        
        // For now, we'll use the default values
        form.reset(defaultValues);
      } catch (error) {
        console.error('Failed to load settings:', error);
        toast({
          title: 'Error',
          description: 'Failed to load settings',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, [form, toast]);

  const onSubmit = async (data: SettingsFormValues) => {
    try {
      setIsSaving(true);
      // In a real app, you would save these settings to your backend
      // await fetch('/api/settings', {
      //   method: 'POST',
      //   body: JSON.stringify(data),
      // });
      
      toast({
        title: 'Success',
        description: 'Settings saved successfully',
      });
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to save settings',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your platform settings and preferences
        </p>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
        </TabsList>

        <form onSubmit={form.handleSubmit(onSubmit)}>
          <TabsContent value="general" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>General Settings</CardTitle>
                <CardDescription>
                  Configure your platform's general settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="siteName">Site Name</Label>
                    <Input
                      id="siteName"
                      placeholder="Site Name"
                      {...form.register('siteName')}
                    />
                    {form.formState.errors.siteName && (
                      <p className="text-sm text-red-500">
                        {form.formState.errors.siteName.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="adminEmail">Admin Email</Label>
                    <Input
                      id="adminEmail"
                      type="email"
                      placeholder="admin@example.com"
                      {...form.register('adminEmail')}
                    />
                    {form.formState.errors.adminEmail && (
                      <p className="text-sm text-red-500">
                        {form.formState.errors.adminEmail.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-4 pt-4">
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <Label htmlFor="maintenanceMode">Maintenance Mode</Label>
                      <p className="text-sm text-muted-foreground">
                        Enable maintenance mode to restrict access to the platform
                      </p>
                    </div>
                    <Switch
                      id="maintenanceMode"
                      checked={form.watch('maintenanceMode')}
                      onCheckedChange={(checked) =>
                        form.setValue('maintenanceMode', checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <Label htmlFor="enableRegistration">Allow New Registrations</Label>
                      <p className="text-sm text-muted-foreground">
                        Allow new users to create accounts
                      </p>
                    </div>
                    <Switch
                      id="enableRegistration"
                      checked={form.watch('enableRegistration')}
                      onCheckedChange={(checked) =>
                        form.setValue('enableRegistration', checked)
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>
                  Configure security and access control settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="maxFileSize">Max File Upload Size (MB)</Label>
                    <Input
                      id="maxFileSize"
                      type="number"
                      min={1}
                      max={50}
                      {...form.register('maxFileSize', { valueAsNumber: true })}
                    />
                    {form.formState.errors.maxFileSize && (
                      <p className="text-sm text-red-500">
                        {form.formState.errors.maxFileSize.message}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Notification Settings</CardTitle>
                <CardDescription>
                  Configure how you receive notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <Label htmlFor="enableEmailNotifications">Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive email notifications for important events
                    </p>
                  </div>
                  <Switch
                    id="enableEmailNotifications"
                    checked={form.watch('enableEmailNotifications')}
                    onCheckedChange={(checked) =>
                      form.setValue('enableEmailNotifications', checked)
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <div className="flex justify-end pt-6">
            <Button type="submit" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </Tabs>
    </div>
  );
}
