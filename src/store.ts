import { create } from 'zustand' 
import { OrderItem } from './types'
import { Product } from './generated/prisma/client'

interface Store {
    order: OrderItem[]
    addToOrder: (product: Product) => void
    addManualToOrder: (name: string, price: number) => void
    increaseQuantity: (id: Product['id']) => void
    decreaseQuantity: (id: Product['id']) => void
    removeItem: (id: Product['id']) => void
    clearOrder: () => void
}

export const useStore = create<Store>((set, get) => (
    {
        order: [],
        addToOrder: (product) => {
            const {...data } = product
            let order: OrderItem[] = []
            if (get().order.find(item => item.id === product.id)) {
                order = get().order.map(item => item.id === product.id ? {
                    ...item,
                    quantity: item.quantity + 1,
                    subtotal: item.price * (item.quantity + 1)
                } : item)
            } else {
                order = [...get().order, {
                    ...data,
                    quantity: 1,
                    subtotal: 1 * product.price
                }]
            }
            set(() => ({
                order
            }))

        },
        addManualToOrder: (name, price) => {
            // Id negativo para no chocar con los productos de la BD
            const id = Math.min(0, ...get().order.map(item => item.id)) - 1
            set((state) => ({
                order: [...state.order, {
                    id,
                    name,
                    price,
                    quantity: 1,
                    subtotal: price,
                    manual: true
                }]
            }))
        },
        increaseQuantity: (id) => {
            set((state) => ({
                order: state.order.map(item => item.id === id ? {
                    ...item,
                    quantity: item.quantity + 1,
                    subtotal: item.price * (item.quantity + 1)
                } : item)
            }))
        },
        decreaseQuantity: (id) => {
            const order = get().order
                .map((item) => item.id === id
                    ? {
                        ...item,
                        quantity: item.quantity - 1,
                        subtotal: item.price * (item.quantity - 1)
                    }
                    : item)
                .filter((item) => item.quantity > 0)

            set(() => ({ order }))
        },
        removeItem:(id) => {
            set((state)=>({
                order: state.order.filter( item=> item.id!== id)
            }))
        },
        clearOrder: () => {
            set(() => ({
                order:[]
            }))
        }
    }
))