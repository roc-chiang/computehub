import { DashboardShell } from "@/components/layout/shell";

export default function BillingLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <DashboardShell>{children}</DashboardShell>;
}
