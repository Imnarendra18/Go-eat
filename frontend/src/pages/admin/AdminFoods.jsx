import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../../api/api";
import FoodCard from "../../components/FoodCard";
import EmptyState from "../../components/EmptyState";
import { messageFromError } from "../../utils/app";

export default function AdminFoods() {
  const [foods, setFoods] = useState([]);
  const [hotelId, setHotelId] = useState("");
  const load = async () => {
    try {
      const { data } = await api.get("/api/admin/foods");
      setFoods(data.foods || []);
    } catch (error) {
      toast.error(messageFromError(error, "Could not load foods"));
    }
  };
  useEffect(() => { load(); }, []);
  const remove = async (food) => {
    try {
      await api.delete(`/api/admin/foods/${food._id}`);
      toast.success("Food deleted from database");
      load();
    } catch (error) {
      toast.error(messageFromError(error, "Could not delete food"));
    }
  };
  const deleteHotelFoods = async (event) => {
    event.preventDefault();
    if (!hotelId) {
      toast.error("Select a hotel first");
      return;
    }

    try {
      const { data } = await api.delete(`/api/foods/admin/hotel/${hotelId}`);
      toast.success(`${data.deletedCount || 0} foods deleted`);
      setHotelId("");
      load();
    } catch (error) {
      toast.error(messageFromError(error, "Could not delete hotel foods"));
    }
  };

  const hotelOptions = Array.from(
    new Map(foods.filter((food) => food.hotelId).map((food) => [food.hotelId, food.hotelName || food.hotelId])).entries(),
  );

  return (
    <main className="page">
      <div className="pageHead"><span className="badge">Admin</span><h1>Food catalog</h1><p className="muted">Delete removes the food document from MongoDB.</p></div>
      <form className="filterBar compact" onSubmit={deleteHotelFoods}>
        <select value={hotelId} onChange={(event) => setHotelId(event.target.value)}>
          <option value="">Select hotel for bulk food delete</option>
          {hotelOptions.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
        </select>
        <button className="dangerBtn">Delete selected hotel's foods</button>
      </form>
      {foods.length ? <section className="cards">{foods.map((food) => <div key={food._id}><FoodCard food={food} /><div className="cardActions"><button className="dangerBtn small" onClick={() => remove(food)}>Delete</button></div></div>)}</section> : <EmptyState title="No foods" />}
    </main>
  );
}
