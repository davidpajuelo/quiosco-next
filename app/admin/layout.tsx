import ToastNotification from "@/components/ui/ToastNotification";
import AdminSidebar from "@/components/admin/AdminSidebar"
import Logo from "@/components/ui/Logo";

export default async function AdminLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <>
            {/* Logo centrado arriba, debajo la barra del admin y el contenido;
                en escritorio el contenido tiene su propio scroll */}
            <div className="md:flex md:flex-col md:h-screen">
                <Logo compact />
                <AdminSidebar />

                <main className="md:flex-1 md:min-h-0 md:overflow-y-auto p-5">
                    {children}
                </main>
            </div>

            <ToastNotification />
        </>
    )
}
