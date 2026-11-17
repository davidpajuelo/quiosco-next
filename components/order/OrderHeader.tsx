import { db } from '@/src/db'
import CategoryNav from './CategoryNav';
import CategoryTab from './CategoryTab';
import Logo from '../ui/Logo';


async function getCategories(){
  return await db.query.categories.findMany();
}

// Logo y, debajo, la barra de categorías. Devuelve un fragmento para que la barra
// quede pegada arriba (sticky) mientras se hace scroll por toda la página en móvil
export default async function OrderHeader() {
  const categories = await getCategories();
  return (
    <>
      <Logo compact/>
      <CategoryNav>
        {categories.map(category => (
          <CategoryTab
          key={category.id}
          category = {category}
          />
        ))}
      </CategoryNav>
    </>
  )
}
