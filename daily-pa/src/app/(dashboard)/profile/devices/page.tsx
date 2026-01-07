'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Smartphone, Monitor, Tablet, Chrome, Globe, Loader2, X, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface Device {
  id: string;
  name: string;
  type: 'desktop' | 'mobile' | 'tablet';
  browser: string;
  location: string;
  lastActive: string;
  isCurrent: boolean;
}

export default function DevicesPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    fetchDevices();
  }, []);

  const fetchDevices = async () => {
    try {
      const res = await fetch('/api/user/devices');
      if (res.ok) {
        const data = await res.json();
        setDevices(data);
      }
    } catch (error) {
      console.error('Failed to fetch devices:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveDevice = async (deviceId: string) => {
    setRemovingId(deviceId);
    try {
      const res = await fetch(`/api/user/devices/${deviceId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setDevices(prev => prev.filter(d => d.id !== deviceId));
      }
    } catch (error) {
      console.error('Failed to remove device:', error);
    } finally {
      setRemovingId(null);
    }
  };

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'desktop':
        return Monitor;
      case 'mobile':
        return Smartphone;
      case 'tablet':
        return Tablet;
      default:
        return Globe;
    }
  };

  const getDeviceColor = (type: string) => {
    switch (type) {
      case 'desktop':
        return 'border-blue-500 text-blue-500';
      case 'mobile':
        return 'border-green-500 text-green-500';
      case 'tablet':
        return 'border-purple-500 text-purple-500';
      default:
        return 'border-gray-400 text-gray-400';
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header 
        title="Devices" 
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
            <GlassCardTitle>Active Sessions</GlassCardTitle>
            <p className="text-sm text-gray-500 mt-1">
              Manage devices where you're currently signed in
            </p>
          </GlassCardHeader>
          <GlassCardContent className="space-y-3">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" strokeWidth={1.5} />
              </div>
            ) : devices.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Smartphone className="w-12 h-12 mx-auto mb-3 text-gray-300" strokeWidth={1.5} />
                <p>No active devices found</p>
              </div>
            ) : (
              devices.map((device) => {
                const Icon = getDeviceIcon(device.type);
                return (
                  <div
                    key={device.id}
                    className={cn(
                      'flex items-center gap-4 p-4 rounded-xl transition-all duration-200',
                      device.isCurrent ? 'bg-blue-50 border-2 border-blue-200' : 'bg-white/30 hover:bg-white/50'
                    )}
                  >
                    <div className={cn('w-12 h-12 rounded-xl border-2 flex items-center justify-center', getDeviceColor(device.type))}>
                      <Icon className="w-6 h-6" strokeWidth={1.5} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900">{device.name}</p>
                        {device.isCurrent && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium text-green-600 bg-green-100 rounded-full">
                            <CheckCircle2 className="w-3 h-3" strokeWidth={2} />
                            Current
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">
                        <Chrome className="w-3 h-3 inline mr-1" strokeWidth={1.5} />
                        {device.browser} • {device.location}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Last active: {device.lastActive}
                      </p>
                    </div>
                    {!device.isCurrent && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveDevice(device.id)}
                        disabled={removingId === device.id}
                        className="text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl"
                      >
                        {removingId === device.id ? (
                          <Loader2 className="w-5 h-5 animate-spin" strokeWidth={1.5} />
                        ) : (
                          <X className="w-5 h-5" strokeWidth={1.5} />
                        )}
                      </Button>
                    )}
                  </div>
                );
              })
            )}
          </GlassCardContent>
        </GlassCard>

        <GlassCard>
          <GlassCardHeader>
            <GlassCardTitle className="text-red-500">Danger Zone</GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent>
            <p className="text-sm text-gray-500 mb-4">
              Sign out from all devices except this one
            </p>
            <Button 
              variant="outline" 
              className="w-full h-12 rounded-xl text-red-500 hover:text-red-600 hover:bg-red-50 border-red-200"
            >
              Sign Out All Other Devices
            </Button>
          </GlassCardContent>
        </GlassCard>
      </div>
    </div>
  );
}
