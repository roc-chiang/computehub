import { Sidebar } from "@/components/layout/sidebar";

export default function DeployLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex h-screen overflow-hidden">
            <Sidebar />
            <main className="flex-1 overflow-y-auto lg:ml-64 pt-16 lg:pt-0 bg-cream-50">
                <div className="container mx-auto p-6 lg:p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
