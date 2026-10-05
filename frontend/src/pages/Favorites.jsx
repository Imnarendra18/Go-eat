import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShoppingCart, Zap } from "lucide-react";
import toast from "react-hot-toast";
import api from "../api/api";
import EmptyState from "../components/EmptyState";
import FoodCard from "../components/FoodCard";
import HotelCard from "../components/HotelCard";
import { messageFromError } from "../utils/app";

export default function Favorites() {
  const navigate = useNavigate();
  const [foods, setFoods] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/api/users/profile");
      const profile = data.profile;
      const [foodResults, hotelResults] = await Promise.all([
        Promise.allSettled((profile?.favoriteFoods || []).map((foodId) => api.get(`/api/foods/${foodId}`))),
        Promise.allSettled((profile?.favoriteHotels || []).map((hotelId) => api.get(`/api/hotels/${hotelId}`))),
      ]);
      setFoods(foodResults.filter((result) => result.status === "fulfilled").map((result) => result.value.data.food));
      setHotels(hotelResults.filter((result) => result.status === "fulfilled").map((result) => result.value.data.hotel));
    } catch (error) {
      toast.error(messageFromError(error, "Could not load favorites"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const addToCart = async (food) => {
    try {
      await api.post("/api/cart/add", {
        foodId: food._id,
        hotelId: food.hotelId,
        foodName: food.name,
        hotelName: food.hotelName,
        image: food.image,
        price: food.price,
        quantity: 1,
      });
      toast.success("Added to cart");
    } catch (error) {
      toast.error(messageFromError(error, "Could not add to cart"));
    }
  };

  const orderNow = (food) => {
    localStorage.setItem("buyNowItem", JSON.stringify(food));
    navigate("/checkout?mode=buy-now");
  };

  const removeFood = async (foodId) => {
    try {
      await api.delete(`/api/users/favorites/food/${foodId}`);
      setFoods((items) => items.filter((food) => food._id !== foodId));
      toast.success("Removed from favorite foods");
    } catch (error) {
      toast.error(messageFromError(error, "Could not remove favorite food"));
    }
  };

  const removeHotel = async (hotelId) => {
    try {
      await api.delete(`/api/users/favorites/hotel/${hotelId}`);
      setHotels((items) => items.filter((hotel) => hotel._id !== hotelId));
      toast.success("Removed from favorite hotels");
    } catch (error) {
      toast.error(messageFromError(error, "Could not remove favorite hotel"));
    }
  };

  return (
    <main className="page">
      <div className="pageHead">
        <span className="badge">Favorites</span>
        <h1>Your saved food and hotels</h1>
        <p className="muted">Favorite foods can be added to cart or ordered directly from here.</p>
      </div>

      {loading ? <p className="muted">Loading favorites...</p> : null}

      <div className="pageHead mt">
        <span className="badge">Food</span>
        <h1>Favorite foods</h1>
      </div>
      {foods.length ? (
        <section className="cards">
          {foods.map((food) => (
            <div key={food._id}>
              <FoodCard food={food} onAdd={addToCart} />
              <div className="cardActions">
                <button className="btn small" onClick={() => addToCart(food)}><ShoppingCart size={15} /> Add to cart</button>
                <button className="btn ghost small" onClick={() => orderNow(food)}><Zap size={15} /> Order now</button>
                <button className="dangerBtn small" onClick={() => removeFood(food._id)}>Remove</button>
              </div>
            </div>
          ))}
        </section>
      ) : <EmptyState title="No favorite foods" text="Open a food detail page and tap Favorite." />}

      <div className="pageHead mt">
        <span className="badge">Hotels</span>
        <h1>Favorite hotels</h1>
      </div>
      {hotels.length ? (
        <section className="cards">
          {hotels.map((hotel) => (
            <div key={hotel._id}>
              <HotelCard hotel={hotel} />
              <div className="cardActions">
                <button className="dangerBtn small" onClick={() => removeHotel(hotel._id)}>Remove</button>
              </div>
            </div>
          ))}
        </section>
      ) : <EmptyState title="No favorite hotels" text="Open a hotel detail page and tap Favorite hotel." />}
    </main>
  );
}
