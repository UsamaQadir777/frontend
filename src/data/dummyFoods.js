export const foodCategories = [
  {
    id: "egg",
    name: "Egg",
    icon: "egg-outline",
    subcategories: [
      {
        id: "fried-egg",
        name: "Fried Egg",
        serving: "100g",
        calories: 196,
        protein: 13.6,
        carbs: 0.8,
        fat: 15.3
      },
      {
        id: "boiled-egg",
        name: "Boiled Egg",
        serving: "100g",
        calories: 155,
        protein: 12.6,
        carbs: 1.1,
        fat: 10.6
      },
      {
        id: "omelette",
        name: "Omelette",
        serving: "100g",
        calories: 154,
        protein: 10.8,
        carbs: 1.9,
        fat: 11.2
      }
    ]
  },
  {
    id: "rice",
    name: "Rice",
    icon: "restaurant-outline",
    subcategories: [
      {
        id: "boiled-rice",
        name: "Boiled Rice",
        serving: "100g",
        calories: 130,
        protein: 2.7,
        carbs: 28,
        fat: 0.3
      },
      {
        id: "tarka-rice",
        name: "Tarka Rice",
        serving: "100g",
        calories: 188,
        protein: 3.6,
        carbs: 30.4,
        fat: 6.2
      }
    ]
  },
  {
    id: "fruit",
    name: "Fruit",
    icon: "nutrition-outline",
    subcategories: [
      {
        id: "banana",
        name: "Banana",
        serving: "100g",
        calories: 89,
        protein: 1.1,
        carbs: 22.8,
        fat: 0.3
      },
      {
        id: "apple",
        name: "Apple",
        serving: "100g",
        calories: 52,
        protein: 0.3,
        carbs: 13.8,
        fat: 0.2
      }
    ]
  },
  {
    id: "protein",
    name: "Protein",
    icon: "barbell-outline",
    subcategories: [
      {
        id: "grilled-chicken",
        name: "Grilled Chicken",
        serving: "100g",
        calories: 165,
        protein: 31,
        carbs: 0,
        fat: 3.6
      },
      {
        id: "lentils",
        name: "Lentils",
        serving: "100g",
        calories: 116,
        protein: 9,
        carbs: 20,
        fat: 0.4
      }
    ]
  }
];

export const allFoods = foodCategories.flatMap((category) =>
  category.subcategories.map((food) => ({
    ...food,
    categoryId: category.id,
    categoryName: category.name
  }))
);
