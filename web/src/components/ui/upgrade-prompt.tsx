import { Crown, Sparkles } from 'lucide-react';
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
                <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 flex items-center justify-center">
                    <Crown className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-2xl">Pro Feature</CardTitle>
                <CardDescription className="text-base">
                    {description || `${feature} is available in ComputeHub Pro`}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="bg-white rounded-lg p-4 space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                        <Sparkles className="h-4 w-4 text-yellow-500" />
                        <span className="font-medium">Unlock {feature}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Get lifetime access to all Pro features for a one-time payment of $49
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                    <Link href="/settings/license" className="flex-1">
                        <Button className="w-full" variant="default">
                            <Crown className="h-4 w-4 mr-2" />
                            Activate License
                        </Button>
                    </Link>
                    <Link href="https://gumroad.com/l/computehub-pro" target="_blank" className="flex-1">
                        <Button className="w-full" variant="outline">
                            Buy Pro - $49
                        </Button>
                    </Link>
                </div>

                <p className="text-xs text-center text-muted-foreground">
                    One-time payment • Lifetime access • All future updates included
                </p>
            </CardContent>
        </Card>
    );
}
