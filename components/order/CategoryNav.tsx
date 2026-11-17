import ScrollTabs from '@/components/ui/ScrollTabs'

// Barra de categorías fija en la parte superior; se desplaza en horizontal si no caben
export default function CategoryNav({ children }: { children: React.ReactNode }) {
    return (
        <nav
            aria-label="Categorías"
            className="sticky top-0 z-40 bg-[var(--color-background-light)] shadow-md"
        >
            <ScrollTabs>{children}</ScrollTabs>
        </nav>
    )
}
