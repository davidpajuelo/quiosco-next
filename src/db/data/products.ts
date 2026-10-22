// Carta actual, sacada de la BD de Prisma antes de recrearla (precios y nombres editados desde el admin).
// categoryId 1..6 depende del orden de categories.ts sobre una BD vacía
export const products = [
    {
        name: "Café Caramel con Chocolate",
        price: 3.8,
        image: "cafe_01",
        categoryId: 1
    },
    {
        name: "Latte Frio con Chocolate Grande",
        price: 4.5,
        image: "cafe_03",
        categoryId: 1
    },
    {
        name: "Latte Frio con Chocolate Grande",
        price: 4.7,
        image: "cafe_04",
        categoryId: 1
    },
    {
        name: "Malteada Fria con Chocolate Grande",
        price: 5.2,
        image: "cafe_05",
        categoryId: 1
    },
    {
        name: "Café Mocha Caliente Chico",
        price: 3.2,
        image: "cafe_06",
        categoryId: 1
    },
    {
        name: "Café Mocha Caliente Grande con Chocolate",
        price: 4.5,
        image: "cafe_07",
        categoryId: 1
    },
    {
        name: "Capuchino XL",
        price: 3.9,
        image: "cafe_02",
        categoryId: 1
    },
    {
        name: "Café Mocha Caliente Mediano",
        price: 3.8,
        image: "cafe_09",
        categoryId: 1
    },
    {
        name: "Café Mocha Frio con Caramelo Mediano",
        price: 4.2,
        image: "cafe_10",
        categoryId: 1
    },
    {
        name: "Café Mocha Frio con Chocolate Mediano",
        price: 4.2,
        image: "cafe_11",
        categoryId: 1
    },
    {
        name: "Café Espresso",
        price: 1.5,
        image: "cafe_12",
        categoryId: 1
    },
    {
        name: "Café Capuchino Grande con Caramelo",
        price: 4.5,
        image: "cafe_13",
        categoryId: 1
    },
    {
        name: "Café Caramelo Grande",
        price: 4.3,
        image: "cafe_14",
        categoryId: 1
    },
    {
        name: "Paquete de 3 donas de Chocolate",
        price: 6,
        image: "donas_01",
        categoryId: 4
    },
    {
        name: "Paquete de 3 donas Glaseadas",
        price: 5.5,
        image: "donas_02",
        categoryId: 4
    },
    {
        name: "Dona de Fresa ",
        price: 2.2,
        image: "donas_03",
        categoryId: 4
    },
    {
        name: "Dona con Galleta de Chocolate ",
        price: 2.5,
        image: "donas_04",
        categoryId: 4
    },
    {
        name: "Dona glass con Chispas Sabor Fresa ",
        price: 2.3,
        image: "donas_05",
        categoryId: 4
    },
    {
        name: "Dona glass con Chocolate ",
        price: 2.3,
        image: "donas_06",
        categoryId: 4
    },
    {
        name: "Dona de Chocolate con MÁS Chocolate ",
        price: 2.6,
        image: "donas_07",
        categoryId: 4
    },
    {
        name: "Paquete de 3 donas de Chocolate ",
        price: 6,
        image: "donas_08",
        categoryId: 4
    },
    {
        name: "Paquete de 3 donas con Vainilla y Chocolate ",
        price: 6,
        image: "donas_09",
        categoryId: 4
    },
    {
        name: "Paquete de 6 Donas",
        price: 11,
        image: "donas_10",
        categoryId: 4
    },
    {
        name: "Paquete de 3 Variadas",
        price: 6,
        image: "donas_11",
        categoryId: 4
    },
    {
        name: "Dona Natural con Chocolate",
        price: 2.2,
        image: "donas_12",
        categoryId: 4
    },
    {
        name: "Paquete de 3 Donas de Chocolate con Chispas",
        price: 6.5,
        image: "donas_13",
        categoryId: 4
    },
    {
        name: "Dona Chocolate y Coco",
        price: 2.5,
        image: "donas_14",
        categoryId: 4
    },
    {
        name: "Paquete Galletas de Chocolate",
        price: 3.5,
        image: "galletas_01",
        categoryId: 6
    },
    {
        name: "Paquete Galletas de Chocolate y Avena",
        price: 3.8,
        image: "galletas_02",
        categoryId: 6
    },
    {
        name: "Paquete de Muffins de Vainilla",
        price: 5.5,
        image: "galletas_03",
        categoryId: 6
    },
    {
        name: "Paquete de 4 Galletas de Avena",
        price: 3.2,
        image: "galletas_04",
        categoryId: 6
    },
    {
        name: "Galletas de Mantequilla Variadas",
        price: 4.5,
        image: "galletas_05",
        categoryId: 6
    },
    {
        name: "Galletas de sabores frutales",
        price: 4,
        image: "galletas_06",
        categoryId: 6
    },
    {
        name: "Hamburguesa Sencilla",
        price: 6.5,
        image: "hamburguesas_01",
        categoryId: 2
    },
    {
        name: "Hamburguesa de Pollo",
        price: 7.5,
        image: "hamburguesas_02",
        categoryId: 2
    },
    {
        name: "Hamburguesa de Pollo y Chili",
        price: 8,
        image: "hamburguesas_03",
        categoryId: 2
    },
    {
        name: "Hamburguesa Queso y  Pepinos",
        price: 7.5,
        image: "hamburguesas_04",
        categoryId: 2
    },
    {
        name: "Hamburguesa Cuarto de Libra",
        price: 8.5,
        image: "hamburguesas_05",
        categoryId: 2
    },
    {
        name: "Hamburguesa Doble Queso",
        price: 9.5,
        image: "hamburguesas_06",
        categoryId: 2
    },
    {
        name: "Hot Dog Especial",
        price: 5.5,
        image: "hamburguesas_07",
        categoryId: 2
    },
    {
        name: "Paquete 2 Hot Dogs",
        price: 8.5,
        image: "hamburguesas_08",
        categoryId: 2
    },
    {
        name: "4 Rebanadas de Pay de Queso",
        price: 14,
        image: "pastel_01",
        categoryId: 5
    },
    {
        name: "Waffle Especial",
        price: 6.5,
        image: "pastel_02",
        categoryId: 5
    },
    {
        name: "Croissants De la casa",
        price: 4.5,
        image: "pastel_03",
        categoryId: 5
    },
    {
        name: "Pay de Queso",
        price: 3.8,
        image: "pastel_04",
        categoryId: 5
    },
    {
        name: "Pastel de Chocolate",
        price: 22,
        image: "pastel_05",
        categoryId: 5
    },
    {
        name: "Rebanada Pastel de Chocolate",
        price: 4.2,
        image: "pastel_06",
        categoryId: 5
    },
    {
        name: "Pizza Spicy con Doble Queso",
        price: 13.5,
        image: "pizzas_01",
        categoryId: 3
    },
    {
        name: "Pizza Jamón y Queso",
        price: 11.9,
        image: "pizzas_02",
        categoryId: 3
    },
    {
        name: "Pizza Doble Queso",
        price: 11.5,
        image: "pizzas_03",
        categoryId: 3
    },
    {
        name: "Pizza Especial de la Casa",
        price: 14.9,
        image: "pizzas_04",
        categoryId: 3
    },
    {
        name: "Pizza Chorizo",
        price: 12.5,
        image: "pizzas_05",
        categoryId: 3
    },
    {
        name: "Pizza Hawaiana",
        price: 12.5,
        image: "pizzas_06",
        categoryId: 3
    },
    {
        name: "Pizza Tocino",
        price: 12.9,
        image: "pizzas_07",
        categoryId: 3
    },
    {
        name: "Pizza Vegetales y Queso",
        price: 12.5,
        image: "pizzas_08",
        categoryId: 3
    },
    {
        name: "Pizza Pepperoni y Queso",
        price: 12.5,
        image: "pizzas_09",
        categoryId: 3
    },
    {
        name: "Pizza Aceitunas y Queso",
        price: 11.9,
        image: "pizzas_10",
        categoryId: 3
    },
    {
        name: "Pizza Queso, Jamón y Champiñones",
        price: 13.5,
        image: "pizzas_11",
        categoryId: 3
    }
]
