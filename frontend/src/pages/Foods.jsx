import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../api/api";
import EmptyState from "../components/EmptyState";
import FoodCard from "../components/FoodCard";
import { messageFromError } from "../utils/app";

export default function Foods() {
  const [foods, setFoods] = useState([]);
  const [filters, setFilters] = useState({ search: "", category: "", isVeg: "" });
  const [loading, setLoading] = useState(true);

  const loadFoods = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/api/foods", { params: filters });
      setFoods(data.foods || []);
    } catch (error) {
      toast.error(messageFromError(error, "Failed to load foods"));
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadFoods();
  }, [loadFoods]);

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
      toast.error(messageFromError(error, "Login as customer to add cart items"));
    }
  };

  return (
    <main className="page">
      <div className="pageHead">
        <span className="badge">Explore food</span>
        <h1>Find your next craving</h1>
        <p className="muted">Filter dishes from every hotel connected through the gateway.</p>
      </div>
      <form className="filterBar" onSubmit={(e) => { e.preventDefault(); loadFoods(); }}>
        <input placeholder="Search biryani, pizza, dosa..." value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} />
        <input placeholder="Category" value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })} />
        <select value={filters.isVeg} onChange={(e) => setFilters({ ...filters, isVeg: e.target.value })}>
          <option value="">All</option>
          <option value="true">Veg</option>
          <option value="false">Non veg</option>
        </select>
        <button className="btn">Search</button>
      </form>
      {loading ? <p className="muted">Loading foods...</p> : foods.length ? (
        <section className="cards">{foods.map((food) => <FoodCard key={food._id} food={food} onAdd={addToCart} />)}</section>
      ) : <EmptyState title="No dishes found" text="Try changing the filters or add foods from the hotel panel." />}
    </main>
  );
}
