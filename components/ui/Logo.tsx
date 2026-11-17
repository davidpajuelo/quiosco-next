import Image from "next/image"

// compact: versión reducida para la cabecera del quiosco
export default function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex justify-center bg-primary">
        <div className={`relative ${compact ? 'w-24 h-20' : 'w-40 h-40'}`}>
            <Image
            fill
            alt='Logotipo Fresh Coffe'
            src='/logo.svg'/>

        </div>
    </div>
  )
}
