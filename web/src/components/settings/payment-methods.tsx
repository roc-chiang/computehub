import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard } from "lucide-react";

export function PaymentMethods() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Payment Method</CardTitle>
                <CardDescription>
                    Manage your payment details.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                        <div className="p-2 bg-muted rounded-full">
                            <CreditCard className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="font-medium">Visa ending in 4242</p>
                            <p className="text-sm text-muted-foreground">Expires 12/2025</p>
                        </div>
                    </div>
                    <Button variant="outline">Update</Button>
                </div>
            </CardContent>
        </Card>
    );
}
