import AdminRoute from "./AdminRoute"
import Logo from "@/components/ui/Logo";

const adminNavigation = [
    {url: '/admin/orders', text: 'Ordenes', blank: false},
    {url: '/admin/products', text: 'Productos', blank: false},
    {url: '/mesa/2?firma=775aaa28703d279808a2961c3e34ffd9b266ca91ad09a05e833fce7a58c9c260', text: 'Ver Quiosco', blank: true},
]

export default function AdminSidebar() {

    return (
        <>

            <div className="space-y-3 ">
                <Logo/>
                <p className="mt-10 uppercase font-bold text-sm text-gray-600 text-center">Navegación</p>
                <nav className="flex flex-col">
                    {adminNavigation.map(link =>(
                        <AdminRoute
                            key={link.url}
                            link = {link}
                        />
                    ))}
                </nav>
            </div>
        </>

    )
}