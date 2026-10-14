'use client'

import { Product } from "@/src/generated/prisma/client"
import { useStore } from "@/src/store"

type addProductButtonProps = {
    product: Product
}
export default function AddProductButton(product: addProductButtonProps) {
    const addToOrder = useStore((state)=> state.addToOrder)
    return (
        <> <button
            type="button"
            className="bg-primary hover:bg-primary-dark text-black w-full mt-5 p-3 uppercase font-bold cursor-pointer"
            onClick={() => addToOrder(product.product)}
            >
            Agregar
        </button>
        </>
    )
}
