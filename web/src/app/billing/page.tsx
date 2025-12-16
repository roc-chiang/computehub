"use client";

import { BillingHistory } from "@/components/settings/billing-history";
import { PaymentMethods } from "@/components/settings/payment-methods";
import { Separator } from "@/components/ui/separator";

export default function BillingPage() {
    return (
        <div className="space-y-6 pb-20">
            <div>
                <h3 className="text-3xl font-bold tracking-tight">Billing</h3>
                <p className="text-muted-foreground">
                    Manage your payment methods and view invoice history.
                </p>
            </div>
            <Separator />

            <div className="space-y-6">
                <PaymentMethods />
                <BillingHistory />
            </div>
        </div>
    );
}
