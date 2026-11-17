import AdminRoute from "./AdminRoute"
import ScrollTabs from "@/components/ui/ScrollTabs";
import { BuildingStorefrontIcon, ClipboardDocumentListIcon, CubeIcon } from "@heroicons/react/24/outline";

const iconClass = 'size-6 shrink-0'

const adminNavigation = [
    {url: '/admin/orders', text: 'Ordenes', blank: false, icon: <ClipboardDocumentListIcon className={iconClass} aria-hidden="true"/>},
    {url: '/admin/products', text: 'Productos', blank: false, icon: <CubeIcon className={iconClass} aria-hidden="true"/>},
    {url: '/admin/quiosco', text: 'Ver Quiosco', blank: false, icon: <BuildingStorefrontIcon className={iconClass} aria-hidden="true"/>},
]

// Barra del admin (debajo del logo): menú desplazable en horizontal
export default function AdminSidebar() {
    return (
        <nav aria-label="Menú de administración" className="bg-[var(--color-background-light)] shadow-md">
            <ScrollTabs>
                {adminNavigation.map(({icon, ...link}) => (
                    <AdminRoute key={link.url} link={link}>
                        {icon}
                    </AdminRoute>
                ))}
            </ScrollTabs>
        </nav>
    )
}
