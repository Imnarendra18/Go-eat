import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../../api/api";
import EmptyState from "../../components/EmptyState";
import { currency, messageFromError } from "../../utils/app";

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  useEffect(() => {
    api.get("/api/admin/orders").then(({ data }) => setOrders(data.orders || [])).catch((error) => toast.error(messageFromError(error, "Could not load orders")));
  }, []);
  return (
    <main className="page">
      <div className="pageHead"><span className="badge">Admin</span><h1>All orders</h1></div>
      {orders.length ? <section className="stack">{orders.map((order) => <article className="panel" key={order._id}><div className="between wrap"><h2>Order #{order._id.slice(-6)}</h2><span className="pill orange">{order.orderStatus}</span><strong>{currency(order.finalAmount)}</strong></div><div className="miniList">{order.items.map((item) => <span key={item._id}>{item.foodName} x {item.quantity}</span>)}</div></article>)}</section> : <EmptyState title="No orders" />}
    </main>
  );
}
