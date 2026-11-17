import OrderHeader from "@/components/order/OrderHeader";
import OrderSummary from "@/components/order/OrderSummary";
import CartButton from "@/components/ui/CartButton";
import ToastNotification from "@/components/ui/ToastNotification";

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode}>)
{return(<>
    <div className="md:flex md:flex-col md:h-screen">
        <OrderHeader />

        <div className="md:flex md:flex-1 md:min-h-0">
            <main className="md:flex-1 md:overflow-y-scroll p-5">
                {children}
            </main>
            <OrderSummary />
        </div>
        <CartButton />
        <ToastNotification/>
    </div>
    </>)}
