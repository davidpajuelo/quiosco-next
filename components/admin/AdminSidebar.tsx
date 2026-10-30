import AdminRoute from "./AdminRoute"
import Logo from "@/components/ui/Logo";

const adminNavigation = [
    {url: '/admin/orders', text: 'Ordenes', blank: false},
    {url: '/admin/products', text: 'Productos', blank: false},
    {url: '/admin/salas', text: 'Salas', blank: false},
    {url: '/admin/rooms', text: 'Crear/Editar Salas', blank: false},
    {url: '/admin/quiosco', text: 'Ver Quiosco', blank: false},
]

export default function AdminSidebar() {

    return (
        <>

            <div className="space-y-3 ">
                <Logo/>
                <p className="mt-8 uppercase text-2xl text-black text-center">Menú</p>
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