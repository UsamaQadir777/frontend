const ACTIVITY_MULTIPLIERS = {
  "no activity": 1.2,
  "normal walk": 1.375,
  "gym/light active": 1.55,
  "very active": 1.725
};

const GOAL_ADJUSTMENTS = {
  weight_loss: -500,
  maintenance: 0,
  weight_gain: 350,
  "lose weight": -500,
  "maintain weight": 0,
  "gain weight": 350
};

const roundToNearest = (value, step = 5) => Math.round(value / step) * step;

export const calculateBmr = ({ gender, weightKg, heightCm, age }) => {
  const base = 10 * Number(weightKg) + 6.25 * Number(heightCm) - 5 * Number(age);

  if (gender === "Male") return base + 5;
  if (gender === "Female") return base - 161;
  return base - 78;
};

export const calculateDailyTargets = (profile) => {
  const bmr = calculateBmr(profile);
  const activityMultiplier = ACTIVITY_MULTIPLIERS[profile.activity] ?? 1.375;
  const goalAdjustment = GOAL_ADJUSTMENTS[profile.goal] ?? 0;
  const calories = Math.max(1200, roundToNearest(bmr * activityMultiplier + goalAdjustment, 25));

  const weight = Number(profile.weightKg) || 70;
  const proteinPerKg =
    profile.goal === "gain weight" || profile.goal === "weight_gain"
      ? 2
      : profile.goal === "lose weight" || profile.goal === "weight_loss"
        ? 1.8
        : 1.6;
  const protein = roundToNearest(weight * proteinPerKg);
  const fat = roundToNearest((calories * 0.25) / 9);
  const proteinCalories = protein * 4;
  const fatCalories = fat * 9;
  const carbs = roundToNearest((calories - proteinCalories - fatCalories) / 4);

  return {
    calories,
    protein,
    carbs: Math.max(80, carbs),
    fat
  };
};

export const calculateMealTotals = (foods = []) =>
  foods.reduce(
    (totals, food) => ({
      calories: totals.calories + Number(food.calories || 0),
      protein: totals.protein + Number(food.protein || 0),
      carbs: totals.carbs + Number(food.carbs || 0),
      fat: totals.fat + Number(food.fat || 0)
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

export const calculateDayTotals = (meals = []) =>
  meals.reduce(
    (totals, meal) => {
      const mealTotals = calculateMealTotals(meal.foods);
      return {
        calories: totals.calories + mealTotals.calories,
        protein: totals.protein + mealTotals.protein,
        carbs: totals.carbs + mealTotals.carbs,
        fat: totals.fat + mealTotals.fat
      };
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

export const calculateRemainingCalories = (goalCalories, achievedCalories) =>
  Math.max(0, Number(goalCalories || 0) - Number(achievedCalories || 0));

export const scaleNutrition = (food, amount, mode = "grams") => {
  const numericAmount = Math.max(0, Number(amount) || 0);
  const factor = mode === "quantity" ? numericAmount : numericAmount / 100;

  return {
    name: food.name,
    calories: Math.round(food.calories * factor),
    protein: Number((food.protein * factor).toFixed(1)),
    carbs: Number((food.carbs * factor).toFixed(1)),
    fat: Number((food.fat * factor).toFixed(1)),
    amount: numericAmount,
    unit: mode === "quantity" ? "serving" : "g"
  };
};

export const mergeProfileWithTargets = (profile) => ({
  ...profile,
  targets: calculateDailyTargets(profile)
});
