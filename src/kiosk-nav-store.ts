import { create } from 'zustand'

// Quiosco de admin y pedido de una mesa (/admin/salas/:id/pedido/:code)
export const KIOSK_PATH = '/admin/quiosco'
export const TABLE_ORDER_PATH = /^\/admin\/salas\/[^/]+\/pedido\/[^/]+/

// Estado de la barra de categorías plegable (CategoryNav con collapsibleAt),
// compartido con las pestañas del admin que la vuelven a mostrar ("Ver Quiosco" y "Salas")
interface KioskNavStore {
    open: boolean // barra de categorías visible aunque haya una categoría elegida
    lastPaths: Record<string, string> // última categoría (o producto manual) abierta, por ruta base
    setOpen: (open: boolean) => void
    setLastPath: (base: string, path: string) => void
}

export const useKioskNavStore = create<KioskNavStore>((set) => ({
    open: false,
    lastPaths: {},
    setOpen: (open) => set({ open }),
    setLastPath: (base, path) => set((state) => ({ lastPaths: { ...state.lastPaths, [base]: path } })),
}))
