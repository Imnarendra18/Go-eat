import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../../api/api";
import EmptyState from "../../components/EmptyState";
import { currency, getUser, messageFromError } from "../../utils/app";

export default function HotelPayments() {
  const user = getUser();
  const ownerId = user?.userId || user?._id;
  const [hotels, setHotels] = useState([]);
  const [hotelId, setHotelId] = useState("");
  const [orders, setOrders] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");

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
      .then(({ data }) => setOrders(data.orders || []))
      .catch((error) => toast.error(messageFromError(error, "Could not load payment summary")));
  }, [hotelId]);

  const visibleOrders = statusFilter
    ? orders.filter((order) => order.paymentStatus === statusFilter)
    : orders;
  const totalRevenue = orders.reduce((sum, order) => sum + Number(order.finalAmount || 0), 0);
  const codOrders = orders.filter((order) => order.paymentMethod === "COD").length;
  const onlineOrders = orders.filter((order) => order.paymentMethod === "RAZORPAY").length;
  const successOrders = orders.filter((order) => order.paymentStatus === "SUCCESS").length;

  return (
    <main className="page">
      <div className="pageHead">
        <span className="badge">Hotel payments</span>
        <h1>Payment section</h1>
        <p className="muted">Hotel payment view is summarized from order-service because payment records belong to users/admins.</p>
      </div>

      <div className="filterBar compact">
        <select value={hotelId} onChange={(event) => setHotelId(event.target.value)}>
          {hotels.map((hotel) => <option key={hotel._id} value={hotel._id}>{hotel.hotelName}</option>)}
        </select>
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
          <option value="">All payment statuses</option>
          <option value="PENDING">PENDING</option>
          <option value="SUCCESS">SUCCESS</option>
          <option value="FAILED">FAILED</option>
          <option value="REFUNDED">REFUNDED</option>
        </select>
      </div>

      <section className="dashGrid">
        <div className="dashCard">Order value <strong>{currency(totalRevenue)}</strong></div>
        <div className="dashCard">COD orders <strong>{codOrders}</strong></div>
        <div className="dashCard">Online orders <strong>{onlineOrders}</strong></div>
        <div className="dashCard">Paid orders <strong>{successOrders}</strong></div>
      </section>

      {visibleOrders.length ? (
        <section className="stack mt">
          {visibleOrders.map((order) => (
            <article className="panel" key={order._id}>
              <div className="between wrap">
                <h2>Order #{order._id.slice(-6)}</h2>
                <span className="pill orange">{order.paymentStatus}</span>
                <strong>{currency(order.finalAmount)}</strong>
              </div>
              <div className="miniList">
                <span>{order.paymentMethod}</span>
                <span>{order.orderStatus}</span>
                <span>Items {order.totalItems}</span>
                <span>{new Date(order.createdAt).toLocaleString()}</span>
              </div>
              <div className="miniList">
                {order.items.filter((item) => item.hotelId === hotelId).map((item) => <span key={item._id}>{item.foodName} x {item.quantity}</span>)}
              </div>
            </article>
          ))}
        </section>
      ) : <EmptyState title="No payment records" text="Orders for the selected hotel will show payment status here." />}
    </main>
  );
}
