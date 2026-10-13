import { cookies } from 'next/headers'
import{ prisma } from '@/src/lib/prisma'
import { TABLE_COOKIE, readTableCookie } from '@/src/lib/table-session'
import CategoryIcon from '../ui/CategoryIcon';
import CategoryDrawer from './CategoryDrawer';
import Logo from '../ui/Logo';


async function getCategories(){
  return await prisma.category.findMany();
}

export default async function OrderSidebar() {
  const categories = await getCategories();
  const tableId = await readTableCookie(cookies().get(TABLE_COOKIE)?.value)
  return (
    <aside className="md:w-72 md:h-screen">
      {tableId && (
        <p className={`text-5xl bg-[#8FA382] text-black text-center font-bold uppercase py-2`}>
          Mesa {tableId}
        </p>
      )}
      <Logo/>
      <CategoryDrawer>
        <nav className='md:mt-10'>
          {categories.map(category => (
            <CategoryIcon
            key={category.id}
            category = {category}
            />
          ))}
        </nav>
      </CategoryDrawer>
    </aside>
  )
}
