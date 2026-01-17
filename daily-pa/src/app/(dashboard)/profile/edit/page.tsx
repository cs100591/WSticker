'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import Link from 'next/link';

interface UserProfile {
  email: string;
  fullName?: string;
}

export default function EditProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/user/profile');
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        setFullName(data.fullName || '');
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName }),
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/profile');
        }, 1500);
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to update profile');
      }
    } catch {
      setError('An error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header 
        title="Edit Profile" 
        showHomeButton={false}
      />
      
      <div className="flex-1 p-4 md:p-6 space-y-4">
        {/* Back Button */}
        <Link href="/profile">
          <Button variant="ghost" size="sm" className="rounded-xl -ml-2">
            <ArrowLeft className="w-4 h-4 mr-2" strokeWidth={1.5} />
            Back to Profile
          </Button>
        </Link>

        <GlassCard>
          <GlassCardHeader>
            <GlassCardTitle>Personal Information</GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent className="space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" strokeWidth={1.5} />
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profile?.email || ''}
                    disabled
                    className="h-12 rounded-xl bg-gray-100"
                  />
                  <p className="text-sm text-gray-500">Email cannot be changed</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your full name"
                    className="h-12 rounded-xl"
                  />
                </div>

                {error && (
                  <div className="p-3 text-sm text-red-500 bg-red-50 rounded-xl">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="p-3 text-sm text-green-500 bg-green-50 rounded-xl">
                    Profile updated successfully! Redirecting...
                  </div>
                )}

                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="w-full h-12 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" strokeWidth={1.5} />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5 mr-2" strokeWidth={1.5} />
                      Save Changes
                    </>
                  )}
                </Button>
              </>
            )}
          </GlassCardContent>
        </GlassCard>
      </div>
    </div>
  );
}
