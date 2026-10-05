import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../api/api";
import EmptyState from "../components/EmptyState";
import { messageFromError } from "../utils/app";

export default function DeliveryTracking() {
  const [items, setItems] = useState([]);
  const [orderId, setOrderId] = useState("");
  const [selected, setSelected] = useState(null);

  const load = async () => {
    try {
      const { data } = await api.get("/api/delivery/my");
      setItems(data.trackings || data.deliveryTrackings || []);
    } catch (error) {
      toast.error(messageFromError(error, "Could not load tracking"));
    }
  };

  useEffect(() => { load(); }, []);

  const findOrder = async (event) => {
    event.preventDefault();
    try {
      const { data } = await api.get(`/api/delivery/order/${orderId}`);
      setSelected(data.tracking);
    } catch (error) {
      setSelected(null);
      toast.error(messageFromError(error, "Tracking not found"));
    }
  };

  const renderTracking = (item) => (
    <article className="panel" key={item._id}>
      <div className="between wrap">
        <h2>Order #{String(item.orderId).slice(-6)}</h2>
        <span className="pill orange">{item.status}</span>
      </div>
      <p className="muted">Partner: {item.deliveryPartnerName || "Not assigned"} {item.deliveryPartnerPhone ? `· ${item.deliveryPartnerPhone}` : ""}</p>
      <div className="miniList">
        <span>ETA {item.estimatedMinutes ?? "-"} min</span>
        <span>{item.distanceToUserKm ?? "-"} km away</span>
        <span>Lat {item.currentLocation?.lat ?? "-"}</span>
        <span>Lng {item.currentLocation?.lng ?? "-"}</span>
      </div>
    </article>
  );

  return (
    <main className="page">
      <div className="pageHead"><span className="badge">Delivery service</span><h1>Track orders</h1></div>
      <form className="filterBar compact" onSubmit={findOrder}>
        <input placeholder="Search tracking by order id" value={orderId} onChange={(event) => setOrderId(event.target.value)} />
        <button className="btn">Find tracking</button>
      </form>
      {selected && <section className="stack mt">{renderTracking(selected)}</section>}
      {items.length ? <section className="stack mt">{items.map(renderTracking)}</section> : <EmptyState title="No active tracking" text="Tracking entries appear after a hotel creates delivery tracking." />}
    </main>
  );
}
