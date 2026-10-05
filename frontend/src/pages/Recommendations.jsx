import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShoppingCart, Zap } from "lucide-react";
import toast from "react-hot-toast";
import api from "../api/api";
import FoodCard from "../components/FoodCard";
import HotelCard from "../components/HotelCard";
import EmptyState from "../components/EmptyState";
import { getDeviceLocation, messageFromError, toCartItem } from "../utils/app";

const LIMIT = 12;

const getFoodScore = (food) => {
  const rating = Number(food.rating || 0);
  const totalOrders = Number(food.totalOrders || 0);
  const reviewCount = Number(food.reviewCount || 0);

  return rating * 40 + totalOrders * 0.5 + reviewCount * 2;
};

const getFoodKey = (food) => food._id || food.foodId || food.name || food.foodName;

const getHotelKey = (hotel) => hotel._id || hotel.hotelId || hotel.hotelName;

const toRecommendationFood = (food) => ({
  _id: food._id,
  foodId: food.foodId,
  hotelId: food.hotelId,
  hotelName: food.hotelName,
  name: food.name || food.foodName,
  foodName: food.foodName || food.name,
  category: food.category,
  price: food.price,
  rating: food.rating,
  totalOrders: food.totalOrders,
  reviewCount: food.reviewCount,
  isVeg: food.isVeg,
  spiceLevel: food.spiceLevel,
  isAvailable: food.isAvailable,
});

const toRecommendationHotel = (hotel) => ({
  _id: hotel._id,
  hotelId: hotel.hotelId,
  hotelName: hotel.hotelName,
  rating: hotel.rating,
  totalOrders: hotel.totalOrders,
  reviewCount: hotel.reviewCount,
  lat: hotel.lat,
  lng: hotel.lng,
});

const hydrateRecommendations = (items, originals, getKey) => {
  const originalById = new Map(originals.map((item) => [getKey(item), item]));

  return items.map((item) => ({
    ...(originalById.get(getKey(item)) || {}),
    ...item,
  }));
};

const getHotelScore = (hotel) => {
  const rating = Number(hotel.rating || 0);
  const totalOrders = Number(hotel.totalOrders || 0);
  const reviewCount = Number(hotel.reviewCount || 0);

  return rating * 40 + totalOrders * 0.4 + reviewCount * 2;
};

const calculateDistanceKm = (lat1, lng1, lat2, lng2) => {
  const radius = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  return Number((radius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(2));
};

const getTrendingFoods = (items) =>
  [...items]
    .map((food) => ({ ...food, recommendationScore: getFoodScore(food) }))
    .sort((a, b) => b.recommendationScore - a.recommendationScore)
    .slice(0, LIMIT);

const getTopHotels = (items) =>
  [...items]
    .map((hotel) => ({ ...hotel, recommendationScore: getHotelScore(hotel) }))
    .sort((a, b) => b.recommendationScore - a.recommendationScore)
    .slice(0, LIMIT);

const getPersonalizedFoods = (items, preferences = {}, budget) => {
  const favoriteCuisines = preferences.favoriteCuisines || [];
  const spiceLevel = preferences.spiceLevel || "";
  let result = [...items];

  if (budget) {
    result = result.filter((food) => Number(food.price) <= Number(budget));
  }

  if (preferences.vegOnly) {
    result = result.filter((food) => food.isVeg === true);
  }

  return result
    .map((food) => {
      let score = getFoodScore(food);
      const category = food.category?.toLowerCase() || "";

      if (favoriteCuisines.some((cuisine) => category.includes(cuisine.toLowerCase()))) {
        score += 30;
      }

      if (spiceLevel && food.spiceLevel?.toLowerCase() === spiceLevel.toLowerCase()) {
        score += 15;
      }

      if (food.isAvailable === false) {
        score -= 100;
      }

      return { ...food, recommendationScore: Number(score.toFixed(2)) };
    })
    .sort((a, b) => b.recommendationScore - a.recommendationScore)
    .slice(0, LIMIT);
};

const getNearbyHotels = (items, location) =>
  items
    .map((hotel) => {
      const lat = hotel.location?.coordinates?.[1] || hotel.lat || 0;
      const lng = hotel.location?.coordinates?.[0] || hotel.lng || 0;
      const distanceKm = calculateDistanceKm(Number(location.lat), Number(location.lng), Number(lat), Number(lng));
      let score = getHotelScore(hotel);

      if (distanceKm <= 5) score += 30;
      else if (distanceKm <= 10) score += 20;
      else if (distanceKm <= 20) score += 10;

      return { ...hotel, lat, lng, distanceKm, recommendationScore: Number(score.toFixed(2)) };
    })
    .filter((hotel) => hotel.distanceKm <= 20)
    .sort((a, b) => b.recommendationScore - a.recommendationScore)
    .slice(0, LIMIT);

export default function Recommendations() {
  const navigate = useNavigate();
  const [foods, setFoods] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [profile, setProfile] = useState(null);
  const [budget, setBudget] = useState("");
  const [mode, setMode] = useState("personalized");
  const [loading, setLoading] = useState(false);
  const [addingId, setAddingId] = useState("");

  useEffect(() => {
    api.get("/api/users/profile").then(({ data }) => setProfile(data.profile)).catch(() => {});
  }, []);

  const load = async () => {
    setLoading(true);
    setFoods([]);
    setHotels([]);

    try {
      if (mode === "trending" || mode === "personalized") {
        const foodRes = await api.get("/api/foods");
        const allFoods = foodRes.data.foods || [];
        const recommendationFoods = allFoods.map(toRecommendationFood);

        if (mode === "trending") {
          const fallbackFoods = getTrendingFoods(allFoods);

          try {
            const { data } = await api.post("/api/recommendations/trending-foods", {
              foods: recommendationFoods,
              limit: LIMIT,
            });
            const recommendedFoods = hydrateRecommendations(data.foods || [], allFoods, getFoodKey);
            setFoods(recommendedFoods.length ? recommendedFoods : fallbackFoods);
          } catch {
            setFoods(fallbackFoods);
          }

          return;
        }

        const preferences = profile?.preferences || {};
        const userBudget = budget ? Number(budget) : undefined;
        const fallbackFoods = getPersonalizedFoods(allFoods, preferences, userBudget);

        try {
          const { data } = await api.post("/api/recommendations/personalized-foods", {
            foods: recommendationFoods,
            userPreferences: preferences,
            budget: userBudget,
            limit: LIMIT,
          });
          const recommendedFoods = hydrateRecommendations(data.foods || [], allFoods, getFoodKey);
          setFoods(recommendedFoods.length ? recommendedFoods : fallbackFoods);
        } catch {
          setFoods(fallbackFoods);
        }

        return;
      }

      const hotelRes = await api.get("/api/hotels");
      const allHotels = hotelRes.data.hotels || [];
      const recommendationHotels = allHotels.map(toRecommendationHotel);

      if (mode === "hotels") {
        const fallbackHotels = getTopHotels(allHotels);

        try {
          const { data } = await api.post("/api/recommendations/top-hotels", {
            hotels: recommendationHotels,
            limit: LIMIT,
          });
          const recommendedHotels = hydrateRecommendations(data.hotels || [], allHotels, getHotelKey);
          setHotels(recommendedHotels.length ? recommendedHotels : fallbackHotels);
        } catch {
          setHotels(fallbackHotels);
        }

        return;
      }

      if (mode === "nearby") {
        const location = await getDeviceLocation();
        const hotelPayload = allHotels.map((hotel) => ({
          ...toRecommendationHotel(hotel),
          lat: hotel.location?.coordinates?.[1] || 0,
          lng: hotel.location?.coordinates?.[0] || 0,
        }));
        const fallbackHotels = getNearbyHotels(allHotels, location);

        try {
          const { data } = await api.post("/api/recommendations/nearby-hotels", {
            hotels: hotelPayload,
            userLocation: location,
            radiusKm: 20,
            limit: LIMIT,
          });
          const recommendedHotels = hydrateRecommendations(data.hotels || [], allHotels, getHotelKey);
          setHotels(recommendedHotels.length ? recommendedHotels : fallbackHotels);
        } catch {
          setHotels(fallbackHotels);
        }
      }
    } catch (error) {
      toast.error(messageFromError(error, "Could not load recommendations"));
    } finally {
      setLoading(false);
    }
  };

  const normalizeFood = (food) => ({
    ...food,
    _id: food._id || food.foodId,
    name: food.name || food.foodName,
  });

  const addToCart = async (food) => {
    const item = normalizeFood(food);
    if (!item._id || !item.hotelId || !item.name || !item.hotelName || !item.price) {
      toast.error("Food details are incomplete");
      return;
    }

    setAddingId(item._id);
    try {
      await api.post("/api/cart/add", toCartItem(item));
      toast.success("Added to cart");
    } catch (error) {
      toast.error(messageFromError(error, "Login as customer to add cart items"));
    } finally {
      setAddingId("");
    }
  };

  const orderNow = (food) => {
    const item = normalizeFood(food);
    if (!item._id || !item.hotelId || !item.name || !item.hotelName || !item.price) {
      toast.error("Food details are incomplete");
      return;
    }

    localStorage.setItem("buyNowItem", JSON.stringify(item));
    navigate("/checkout?mode=buy-now");
  };

  return (
    <main className="page">
      <div className="pageHead">
        <span className="badge">Recommendation service</span>
        <h1>Smart recommendations</h1>
        <p className="muted">Trending foods, top hotels, nearby hotels, and personalized picks use the recommendation microservice.</p>
      </div>
      <div className="filterBar compact">
        <select value={mode} onChange={(event) => setMode(event.target.value)}>
          <option value="personalized">Personalized foods</option>
          <option value="trending">Trending foods</option>
          <option value="hotels">Top hotels</option>
          <option value="nearby">Nearby hotels</option>
        </select>
        <input placeholder="Budget for personalized foods" value={budget} onChange={(event) => setBudget(event.target.value)} />
        <button className="btn" onClick={load} disabled={loading}>{loading ? "Loading..." : "Recommend"}</button>
      </div>
      {foods.length ? (
        <section className="cards">
          {foods.map((food) => {
            const item = normalizeFood(food);
            return (
              <div key={item._id || item.name}>
                <FoodCard food={item} onAdd={addToCart} />
                <div className="cardActions">
                  <button className="btn small" onClick={() => addToCart(item)} disabled={addingId === item._id}>
                    <ShoppingCart size={15} /> {addingId === item._id ? "Adding..." : "Add cart"}
                  </button>
                  <button className="btn ghost small" onClick={() => orderNow(item)}>
                    <Zap size={15} /> Order now
                  </button>
                </div>
              </div>
            );
          })}
        </section>
      ) : null}
      {hotels.length ? <section className="cards">{hotels.map((hotel) => <HotelCard key={hotel._id || hotel.hotelName} hotel={hotel} />)}</section> : null}
      {!foods.length && !hotels.length ? <EmptyState title="Pick a mode" text="Choose a recommendation type and run it." /> : null}
    </main>
  );
}
