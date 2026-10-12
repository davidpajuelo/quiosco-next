import Stripe from "stripe";

let stripe: Stripe | undefined

export function getStripe() {
    if (!stripe) {
        if (!process.env.STRIPE_SECRET_KEY) {
            throw new Error('Falta la variable de entorno STRIPE_SECRET_KEY')
        }
        stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
    }
    return stripe
}

export type CheckoutItem = {
    name: string
    price: number
    quantity: number
}

// Stripe trabaja con céntimos enteros (29.90 -> 2990), el resto de la aplicación con euros
function toCents(amount: number) {
    return Math.round(amount * 100)
}

// Crea una sesión de Checkout alojado de Stripe para pagar con Bizum
export async function createCheckoutSession(items: CheckoutItem[], origin: string) {
    return getStripe().checkout.sessions.create({
        mode: 'payment',
        allowed_payment_method_types: ['bizum', 'card'],
        line_items: items.map(item => ({
            quantity: item.quantity,
            price_data: {
                currency: 'eur',
                unit_amount: toCents(item.price),
                product_data: {
                    name: item.name
                }
            }
        })),
        success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/checkout/cancel`
    })
}
