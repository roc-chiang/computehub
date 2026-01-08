"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CostLimitConfig } from "@/components/automation/cost-limit-config";
import { RuleBuilder } from "@/components/automation/rule-builder";
import { RuleExecutionHistory } from "@/components/automation/rule-execution-history";

export default function AdvancedAutomationPage() {
    const [activeTab, setActiveTab] = useState("cost-limits");

    return (
        <div className="container mx-auto py-8 max-w-6xl">
            <div className="mb-6">
                <h1 className="text-3xl font-bold">Advanced Automation</h1>
                <p className="text-muted-foreground mt-2">
                    Configure cost limits and custom automation rules for your deployments
                </p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="cost-limits">Cost Limits</TabsTrigger>
                    <TabsTrigger value="rules">Automation Rules</TabsTrigger>
                    <TabsTrigger value="history">Execution History</TabsTrigger>
                </TabsList>

                <TabsContent value="cost-limits" className="space-y-4">
                    <CostLimitConfig />
                </TabsContent>

                <TabsContent value="rules" className="space-y-4">
                    <RuleBuilder />
                </TabsContent>

                <TabsContent value="history" className="space-y-4">
                    <RuleExecutionHistory />
                </TabsContent>
            </Tabs>
        </div>
    );
}
