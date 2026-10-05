def simple_food_recommendation(
    foods,
    budget=None,
    veg_only=False,
    category=None,
):
    filtered_foods = foods

    if budget:
        filtered_foods = [
            food for food in filtered_foods
            if food.get("price", 0) <= budget
        ]

    if veg_only:
        filtered_foods = [
            food for food in filtered_foods
            if food.get("isVeg") is True
        ]

    if category:
        filtered_foods = [
            food for food in filtered_foods
            if category.lower() in food.get("category", "").lower()
        ]

    sorted_foods = sorted(
        filtered_foods,
        key=lambda food: food.get("rating", 0),
        reverse=True,
    )

    return sorted_foods[:5]