import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ClipboardList, IndianRupee, Star, Store, Users, Utensils } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../api/api";
import { currency, getUser, messageFromError } from "../../utils/app";

export default function HotelDashboard() {
  const user = getUser();
  const ownerId = user?.userId || user?._id;
  const [hotels, setHotels] = useState([]);
  const [hotelId, setHotelId] = useState("");
  const [foods, setFoods] = useState([]);
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    api.get("/api/hotels").then(({ data }) => {
      const mine = (data.hotels || []).filter((hotel) => hotel.ownerId === ownerId);
      setHotels(mine);
      if (mine[0]?._id) setHotelId(mine[0]._id);
    }).catch((error) => toast.error(messageFromError(error, "Could not load hotel home")));

    api.get("/api/foods/my-foods").then(({ data }) => setFoods(data.foods || [])).catch(() => {});
  }, [ownerId]);

  useEffect(() => {
    if (!hotelId) return;
    api.get(`/api/orders/hotel/${hotelId}`)
      .then(({ data }) => setOrders(data.orders || []))
      .catch(() => {});
  }, [hotelId]);

  const selectedHotel = hotels.find((hotel) => hotel._id === hotelId);
  const hotelFoods = foods.filter((food) => !hotelId || food.hotelId === hotelId);
  const activeOrders = orders.filter((order) => !["DELIVERED", "CANCELLED", "REFUNDED"].includes(order.orderStatus));
  const completedOrders = orders.filter((order) => ["DELIVERED", "CANCELLED", "REFUNDED"].includes(order.orderStatus));
  const uniqueUsers = new Set(orders.map((order) => order.userId)).size;
  const revenue = completedOrders.reduce((sum, order) => sum + Number(order.finalAmount || 0), 0);

  return (
    <main className="page">
      <div className="pageHead between wrap">
        <div>
          <span className="badge">Hotel home</span>
          <h1>{selectedHotel?.hotelName || "Run your GoEat kitchen"}</h1>
          <p className="muted">A live overview of menu, customers, orders, ratings, and completed sales.</p>
        </div>
        <select value={hotelId} onChange={(event) => setHotelId(event.target.value)}>
          {hotels.map((hotel) => <option key={hotel._id} value={hotel._id}>{hotel.hotelName}</option>)}
        </select>
      </div>

      <section className="dashGrid">
        <div className="dashCard"><Users size={26} /> Users ordered <strong>{uniqueUsers}</strong></div>
        <Link className="dashCard" to="/hotel/foods"><Utensils size={26} /> Food items <strong>{hotelFoods.length}</strong></Link>
        <Link className="dashCard" to="/hotel/orders"><ClipboardList size={26} /> Active orders <strong>{activeOrders.length}</strong></Link>
        <div className="dashCard"><Star size={26} /> Rating <strong>{selectedHotel?.rating || "New"}</strong></div>
        <div className="dashCard"><IndianRupee size={26} /> Completed revenue <strong>{currency(revenue)}</strong></div>
        <Link className="dashCard" to="/hotel/profile"><Store size={26} /> Hotel profile</Link>
      </section>
    </main>
  );
}
