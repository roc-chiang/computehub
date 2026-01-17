import { Crown, Sparkles, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

interface UpgradePromptProps {
    feature: string;
    description?: string;
}

export function UpgradePrompt({ feature, description }: UpgradePromptProps) {
    return (
        <Card className="border-2 border-yellow-200 bg-gradient-to-br from-yellow-50 to-orange-50">
            <CardHeader className="text-center pb-4">
                <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 flex items-center justify-center animate-pulse">
                    <Crown className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-2xl">🎯 Pro Feature</CardTitle>
                <CardDescription className="text-base">
                    {description || `${feature} is available in ComputeHub Pro`}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="bg-white rounded-lg p-4 space-y-3">
                    <div className="flex items-center gap-2 text-sm font-semibold text-yellow-700">
                        <Sparkles className="h-4 w-4" />
                        <span>Unlock {feature} and more</span>
                    </div>

                    <div className="space-y-2 text-sm text-muted-foreground">
                        <div className="flex items-start gap-2">
                            <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <span>Batch operations for all deployments</span>
                        </div>
                        <div className="flex items-start gap-2">
                            <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <span>Automation engine with auto-restart</span>
                        </div>
                        <div className="flex items-start gap-2">
                            <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <span>Email & Telegram notifications</span>
                        </div>
                        <div className="flex items-start gap-2">
                            <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <span>Advanced templates (ComfyUI, SD WebUI)</span>
                        </div>
                    </div>

                    <div className="pt-2 border-t">
                        <p className="text-sm font-medium text-center">
                            💰 <strong>$49 one-time</strong> • Lifetime access • All future updates
                        </p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                    <Link href="/settings/license" className="flex-1">
                        <Button className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white" size="lg">
                            <Crown className="h-4 w-4 mr-2" />
                            Activate License
                        </Button>
                    </Link>
                    <Link href="https://gumroad.com/l/computehub-pro" target="_blank" className="flex-1">
                        <Button className="w-full" variant="outline" size="lg">
                            Buy Pro - $49
                        </Button>
                    </Link>
                </div>

                <p className="text-xs text-center text-muted-foreground">
                    ✨ No subscription • Cancel anytime • 100% open source
                </p>
            </CardContent>
        </Card>
    );
}
