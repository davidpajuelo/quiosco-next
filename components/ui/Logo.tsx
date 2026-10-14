import Image from "next/image"

export default function Logo() {
  return (
    <div className="flex justify-center bg-primary">
        <div className="relative w-40 h-40">
            <Image 
            fill
            alt='Logotipo Fresh Coffe'
            src='/logo.svg'/>

        </div>
    </div>
  )
}
