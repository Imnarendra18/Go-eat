import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../../api/api";
import EmptyState from "../../components/EmptyState";
import { currency, getUser, messageFromError } from "../../utils/app";

export default function HotelPastOrders() {
  const user = getUser();
  const ownerId = user?.userId || user?._id;
  const [hotels, setHotels] = useState([]);
  const [hotelId, setHotelId] = useState("");
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    api.get("/api/hotels").then(({ data }) => {
      const mine = (data.hotels || []).filter((hotel) => hotel.ownerId === ownerId);
      setHotels(mine);
      if (mine[0]?._id) setHotelId(mine[0]._id);
    }).catch(() => {});
  }, [ownerId]);

  useEffect(() => {
    if (!hotelId) return;
    api.get(`/api/orders/hotel/${hotelId}`)
      .then(({ data }) => setOrders((data.orders || []).filter((order) => ["DELIVERED", "CANCELLED", "REFUNDED"].includes(order.orderStatus))))
      .catch((error) => toast.error(messageFromError(error, "Could not load past orders")));
  }, [hotelId]);

  return (
    <main className="page">
      <div className="pageHead"><span className="badge">Past orders</span><h1>Completed history</h1></div>
      <div className="filterBar compact">
        <select value={hotelId} onChange={(event) => setHotelId(event.target.value)}>
          {hotels.map((hotel) => <option key={hotel._id} value={hotel._id}>{hotel.hotelName}</option>)}
        </select>
      </div>
      {orders.length ? <section className="stack">{orders.map((order) => <article className="panel" key={order._id}><div className="between wrap"><h2>Order #{order._id.slice(-6)}</h2><span className="pill orange">{order.orderStatus}</span><strong>{currency(order.finalAmount)}</strong></div></article>)}</section> : <EmptyState title="No past orders" text="Delivered, cancelled, and refunded orders appear here." />}
    </main>
  );
}
