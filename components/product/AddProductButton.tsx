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
            className="bg-[#A9BA9D] hover:bg-[#8FA382] text-black w-full mt-5 p-3 uppercase font-bold cursos-pointer"
            onClick={() => addToOrder(product.product)}
            >
            Agregar
        </button>
        </>
    )
}
