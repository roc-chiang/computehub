'use client';

import { useState } from 'react';
import { useLicense } from '@/contexts/license-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Crown, Check, X, Loader2, ExternalLink, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function LicensePage() {
    const { license, loading, activateLicense, deactivateLicense } = useLicense();
    const [licenseKey, setLicenseKey] = useState('');
    const [activating, setActivating] = useState(false);
    const [deactivating, setDeactivating] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const handleActivate = async () => {
        if (!licenseKey.trim()) {
            setMessage({ type: 'error', text: 'Please enter a license key' });
            return;
        }

        setActivating(true);
        setMessage(null);

        const result = await activateLicense(licenseKey);

        if (result.success) {
            setMessage({ type: 'success', text: result.message });
            setLicenseKey('');
        } else {
            setMessage({ type: 'error', text: result.message });
        }

        setActivating(false);
    };

    const handleDeactivate = async () => {
        if (!confirm('Are you sure you want to deactivate your Pro License? All Pro features will be disabled.')) {
            return;
        }

        setDeactivating(true);
        setMessage(null);

        const result = await deactivateLicense();

        if (result.success) {
            setMessage({ type: 'success', text: result.message });
        } else {
            setMessage({ type: 'error', text: result.message });
        }

        setDeactivating(false);
    };

    if (loading) {
        return (
            <div className="container max-w-4xl py-8">
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            </div>
        );
    }

    return (
        <div className="container max-w-4xl py-8 space-y-6">
            {/* Header */}
            <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                    <Crown className="h-8 w-8 text-yellow-500" />
                    Pro License
                </h1>
                <p className="text-muted-foreground">
                    Manage your ComputeHub Pro License and unlock advanced features
                </p>
            </div>

            {/* Messages */}
            {message && (
                <Alert variant={message.type === 'success' ? 'default' : 'destructive'}>
                    {message.type === 'success' ? (
                        <Check className="h-4 w-4" />
                    ) : (
                        <X className="h-4 w-4" />
                    )}
                    <AlertDescription>{message.text}</AlertDescription>
                </Alert>
            )}

            {/* License Status */}
            {license.isProEnabled ? (
                <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="h-12 w-12 rounded-full bg-gradient-to-r from-green-400 to-emerald-500 flex items-center justify-center">
                                    <Check className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <CardTitle className="text-green-700">Pro License Active</CardTitle>
                                    <CardDescription>All Pro features are unlocked</CardDescription>
                                </div>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="bg-white rounded-lg p-4 space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium">License Key</span>
                                <span className="text-sm font-mono text-muted-foreground">{license.licenseKey}</span>
                            </div>
                            {license.activatedAt && (
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium">Activated</span>
                                    <span className="text-sm text-muted-foreground">
                                        {new Date(license.activatedAt).toLocaleDateString()}
                                    </span>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                onClick={handleDeactivate}
                                disabled={deactivating}
                                className="flex-1"
                            >
                                {deactivating ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Deactivating...
                                    </>
                                ) : (
                                    'Deactivate License'
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <Card className="border-2 border-yellow-200">
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 flex items-center justify-center">
                                <Crown className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <CardTitle>Activate Pro License</CardTitle>
                                <CardDescription>Enter your license key to unlock Pro features</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <label htmlFor="license-key" className="text-sm font-medium">
                                License Key
                            </label>
                            <Input
                                id="license-key"
                                placeholder="COMPUTEHUB-XXXX-XXXX-XXXX-XXXX"
                                value={licenseKey}
                                onChange={(e) => setLicenseKey(e.target.value.toUpperCase())}
                                className="font-mono"
                                disabled={activating}
                            />
                            <p className="text-xs text-muted-foreground">
                                Enter your 25-character license key
                            </p>
                        </div>

                        <div className="flex gap-3">
                            <Button
                                onClick={handleActivate}
                                disabled={activating || !licenseKey.trim()}
                                className="flex-1"
                            >
                                {activating ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Activating...
                                    </>
                                ) : (
                                    <>
                                        <Crown className="h-4 w-4 mr-2" />
                                        Activate License
                                    </>
                                )}
                            </Button>
                            <Link href="https://gumroad.com/l/computehub-pro" target="_blank">
                                <Button variant="outline">
                                    Buy Pro - $49
                                    <ExternalLink className="h-4 w-4 ml-2" />
                                </Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Pro Features */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-yellow-500" />
                        Pro Features
                    </CardTitle>
                    <CardDescription>
                        Unlock these powerful features with ComputeHub Pro
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid md:grid-cols-2 gap-4">
                        {[
                            { name: 'Batch Operations', desc: 'Start, stop, or delete multiple deployments at once' },
                            { name: 'Automation Engine', desc: 'Auto-restart on failure, cost limits, health checks' },
                            { name: 'Email Notifications', desc: 'Get notified about deployment events' },
                            { name: 'Telegram Notifications', desc: 'Receive alerts via Telegram Bot' },
                            { name: 'Webhook Integration', desc: 'Integrate with your own systems' },
                            { name: 'Advanced Monitoring', desc: 'GPU utilization charts and trends' },
                            { name: 'Advanced Templates', desc: 'ComfyUI, SD WebUI, Llama optimized' },
                            { name: 'Email Support', desc: 'Priority email support' },
                        ].map((feature, index) => (
                            <div key={index} className="flex gap-3 p-3 rounded-lg border bg-card">
                                <div className="flex-shrink-0">
                                    <div className="h-8 w-8 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 flex items-center justify-center">
                                        <Check className="h-4 w-4 text-white" />
                                    </div>
                                </div>
                                <div>
                                    <p className="font-medium text-sm">{feature.name}</p>
                                    <p className="text-xs text-muted-foreground">{feature.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-6 p-4 bg-muted rounded-lg">
                        <p className="text-sm text-center">
                            <strong>$49 one-time payment</strong> • Lifetime access • All future updates included • No subscription
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
