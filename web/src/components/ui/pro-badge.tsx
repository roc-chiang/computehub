import { Crown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function ProBadge({ className }: { className?: string }) {
    return (
        <Badge
            className={`bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0 ${className}`}
        >
            <Crown className="h-3 w-3 mr-1" />
            PRO
        </Badge>
    );
}
