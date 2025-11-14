'use client';

import { useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Link as LinkIcon, CheckCircle } from 'lucide-react';

interface AddTikTokFormProps {
  onSuccess?: () => void;
}

export function AddTikTokForm({ onSuccess }: AddTikTokFormProps) {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess(false);

    try {
      // Validate URL
      if (!url.includes('tiktok.com')) {
        throw new Error('Please enter a valid TikTok URL');
      }

      const result = await apiClient.ingestTikTok(url);
      
      console.log('✅ TikTok saved:', result);
      
      setSuccess(true);
      setUrl('');
      
      // Call onSuccess callback to refresh the list
      setTimeout(() => {
        onSuccess?.();
        setSuccess(false);
      }, 2000);
      
    } catch (err: any) {
      console.error('❌ Failed to save TikTok:', err);
      setError(err.message || 'Failed to save TikTok. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <LinkIcon className="h-5 w-5" />
          Save TikTok
        </CardTitle>
        <CardDescription>
          Paste a TikTok URL to extract recipes, workouts, or recommendations
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-2">
            <Input
              type="url"
              placeholder="https://www.tiktok.com/@user/video/..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={isLoading}
              required
              className="flex-1"
            />
            <Button type="submit" disabled={isLoading || !url}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save'
              )}
            </Button>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
              <AlertDescription className="text-green-600 dark:text-green-400">
                TikTok saved! Processing audio and extracting content…
              </AlertDescription>
            </Alert>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
