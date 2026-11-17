import ToastNotification from "@/components/ui/ToastNotification";
import AdminSidebar from "@/components/admin/AdminSidebar"
import Logo from "@/components/ui/Logo";
import { HeaderSlot } from "@/components/ui/HeaderSlot";

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
                {/* relative solo para colocar encima de la cabecera el contenido de HeaderPortal
                    (p. ej. la mesa del pedido); la cabecera no cambia */}
                <div className="relative">
                    <Logo compact />
                    <HeaderSlot />
                </div>
                <AdminSidebar />

                <main className="md:flex-1 md:min-h-0 md:overflow-y-auto p-5">
                    {children}
                </main>
            </div>

            <ToastNotification />
        </>
    )
}
