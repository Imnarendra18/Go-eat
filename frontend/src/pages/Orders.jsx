import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../api/api";
import EmptyState from "../components/EmptyState";
import { currency, messageFromError } from "../utils/app";

export default function Orders() {
  const [orders, setOrders] = useState([]);

  const load = async () => {
    try {
      const { data } = await api.get("/api/orders/my-orders");
      setOrders(data.orders || []);
    } catch (error) {
      toast.error(messageFromError(error, "Could not load orders"));
    }
  };

  useEffect(() => { load(); }, []);

  const cancel = async (order) => {
    try {
      await api.patch(`/api/orders/${order._id}/cancel`, { cancelReason: "Cancelled from app" });
      toast.success("Order cancelled");
      load();
    } catch (error) {
      toast.error(messageFromError(error, "Could not cancel order"));
    }
  };

  return (
    <main className="page">
      <div className="pageHead"><span className="badge">Orders</span><h1>Order history</h1></div>
      {!orders.length ? <EmptyState title="No orders yet" text="Checkout your cart to see orders here." /> : (
        <section className="stack">{orders.map((order) => (
          <article className="panel orderPanel" key={order._id}>
            <div className="between wrap">
              <div><h2>Order #{order._id.slice(-6)}</h2><p className="muted">{new Date(order.createdAt).toLocaleString()}</p></div>
              <span className="pill orange">{order.orderStatus}</span>
            </div>
            <div className="miniList">{order.items.map((item) => <span key={item._id}>{item.foodName} x {item.quantity}</span>)}</div>
            <div className="between"><strong>{currency(order.finalAmount)}</strong>{!["DELIVERED", "CANCELLED"].includes(order.orderStatus) && <button className="dangerBtn" onClick={() => cancel(order)}>Cancel</button>}</div>
          </article>
        ))}</section>
      )}
    </main>
  );
}
