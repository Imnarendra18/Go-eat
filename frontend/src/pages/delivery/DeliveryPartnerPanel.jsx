import { useCallback, useEffect, useMemo, useState } from "react";
import { MapPin, Navigation, Truck } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../api/api";
import EmptyState from "../../components/EmptyState";
import { currency, getDeviceLocation, getUser, messageFromError } from "../../utils/app";

const deliveryStatuses = ["ASSIGNED", "PICKED_UP", "ON_THE_WAY", "NEAR_USER", "DELIVERED", "CANCELLED"];
const activeStatuses = ["ASSIGNED", "PICKED_UP", "ON_THE_WAY", "NEAR_USER"];

const statusClass = (status) =>
  status === "DELIVERED" ? "pill green" : status === "CANCELLED" ? "pill red" : "pill orange";

export default function DeliveryPartnerPanel() {
  const user = getUser();
  const partnerId = user?.userId || user?._id;
  const [activeTrackings, setActiveTrackings] = useState([]);
  const [historyTrackings, setHistoryTrackings] = useState([]);
  const [orders, setOrders] = useState({});
  const [etaInputs, setEtaInputs] = useState({});
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!partnerId) return;
    setLoading(true);
    try {
      const [activeRes, historyRes] = await Promise.all([
        api.get(`/api/delivery/partner/${partnerId}`),
        api.get(`/api/delivery/partner/${partnerId}`, { params: { scope: "history" } }),
      ]);

      const activeItems = activeRes.data.trackings || [];
      const historyItems = historyRes.data.trackings || [];
      const allItems = [...activeItems, ...historyItems];
      setActiveTrackings(activeItems);
      setHistoryTrackings(historyItems);
      setEtaInputs(Object.fromEntries(activeItems.map((item) => [item.orderId, item.estimatedMinutes ?? ""])));

      const orderResults = await Promise.allSettled(
        allItems.map((item) => api.get(`/api/orders/${item.orderId}`).then((res) => [item.orderId, res.data.order])),
      );
      setOrders(Object.fromEntries(
        orderResults
          .filter((result) => result.status === "fulfilled")
          .map((result) => result.value),
      ));
    } catch (error) {
      toast.error(messageFromError(error, "Could not load assigned deliveries"));
    } finally {
      setLoading(false);
    }
  }, [partnerId]);

  useEffect(() => { load(); }, [load]);

  const visibleTrackings = statusFilter
    ? activeTrackings.filter((item) => item.status === statusFilter)
    : activeTrackings;

  const stats = useMemo(() => activeTrackings.reduce((acc, item) => {
    acc.total += 1;
    acc[item.status] = (acc[item.status] || 0) + 1;
    return acc;
  }, { total: 0 }), [activeTrackings]);

  const updateStatus = async (tracking, status) => {
    try {
      const { data } = await api.patch(`/api/delivery/order/${tracking.orderId}/status`, { status });
      if (status === "DELIVERED" || status === "CANCELLED") {
        setActiveTrackings((items) => items.filter((item) => item._id !== tracking._id));
        setHistoryTrackings((items) => [data.tracking, ...items.filter((item) => item._id !== tracking._id)]);
      } else {
        setActiveTrackings((items) => items.map((item) => (item._id === tracking._id ? data.tracking : item)));
      }
      toast.success("Delivery status updated");
    } catch (error) {
      toast.error(messageFromError(error, "Could not update delivery status"));
    }
  };

  const updateLocation = async (tracking) => {
    try {
      const location = await getDeviceLocation();
      const estimatedMinutes = etaInputs[tracking.orderId];
      const payload = {
        ...location,
        estimatedMinutes: estimatedMinutes === "" ? undefined : Number(estimatedMinutes),
      };
      const { data } = await api.patch(`/api/delivery/order/${tracking.orderId}/location`, payload);
      setActiveTrackings((items) => items.map((item) => (item._id === tracking._id ? data.tracking : item)));
      toast.success("Live location updated");
    } catch (error) {
      toast.error(messageFromError(error, "Could not update location"));
    }
  };

  const renderTracking = (tracking, { readonly = false } = {}) => {
    const order = orders[tracking.orderId];

    return (
      <article className="panel" key={tracking._id}>
        <div className="between wrap">
          <h2><Truck size={20} /> Order #{String(tracking.orderId).slice(-6)}</h2>
          <span className={statusClass(tracking.status)}>{tracking.status}</span>
        </div>
        <p className="muted">Hotel {tracking.hotelId} - Customer {tracking.userId}</p>
        {order && (
          <div className="miniList">
            <span>{order.userName || "Customer"}</span>
            <span>{order.userPhone || "No phone"}</span>
            <span>{order.paymentMethod}</span>
            <span>{order.paymentStatus}</span>
            <span>{currency(order.finalAmount)}</span>
          </div>
        )}
        {order?.items?.length ? (
          <div className="miniList">
            {order.items.map((item) => <span key={item._id || item.foodId}>{item.foodName} x {item.quantity}</span>)}
          </div>
        ) : null}
        <div className="miniList">
          <span>ETA {tracking.estimatedMinutes ?? "-"} min</span>
          <span>{tracking.distanceToUserKm ?? "-"} km away</span>
          <span>Pickup {tracking.pickupLocation?.address || `${tracking.pickupLocation?.lat ?? "-"}, ${tracking.pickupLocation?.lng ?? "-"}`}</span>
          <span>Drop {tracking.dropLocation?.address || `${tracking.dropLocation?.lat ?? "-"}, ${tracking.dropLocation?.lng ?? "-"}`}</span>
          <span>Current {tracking.currentLocation?.lat ?? "-"}, {tracking.currentLocation?.lng ?? "-"}</span>
          <span>Updated {tracking.currentLocation?.updatedAt ? new Date(tracking.currentLocation.updatedAt).toLocaleString() : "-"}</span>
        </div>
        {!readonly && (
          <div className="row wrap mt">
            <input
              style={{ maxWidth: 170 }}
              placeholder="ETA minutes"
              value={etaInputs[tracking.orderId] ?? ""}
              onChange={(event) => setEtaInputs({ ...etaInputs, [tracking.orderId]: event.target.value })}
            />
            <button className="btn small" onClick={() => updateLocation(tracking)}>
              <Navigation size={15} /> Update location
            </button>
            <a
              className="btn ghost small"
              href={`https://www.google.com/maps/dir/?api=1&destination=${tracking.dropLocation?.lat || ""},${tracking.dropLocation?.lng || ""}`}
              target="_blank"
              rel="noreferrer"
            >
              <MapPin size={15} /> Route
            </a>
            <select value={tracking.status} onChange={(event) => updateStatus(tracking, event.target.value)}>
              {deliveryStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
            </select>
          </div>
        )}
      </article>
    );
  };

  return (
    <main className="page">
      <div className="pageHead">
        <span className="badge">Delivery partner</span>
        <h1>Assigned deliveries</h1>
        <p className="muted">Update pickup, route, live location, and final delivery status for your assigned orders.</p>
        <p className="smallText">Partner ID: {partnerId}</p>
      </div>

      <section className="dashGrid">
        <div className="dashCard">Active orders <strong>{stats.total}</strong></div>
        <div className="dashCard">Picked up <strong>{stats.PICKED_UP || 0}</strong></div>
        <div className="dashCard">On the way <strong>{stats.ON_THE_WAY || 0}</strong></div>
        <div className="dashCard">Near user <strong>{stats.NEAR_USER || 0}</strong></div>
      </section>

      <div className="filterBar compact">
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
          <option value="">All active statuses</option>
          {activeStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
        </select>
        <button className="btn" onClick={load} disabled={loading}>{loading ? "Loading..." : "Refresh"}</button>
      </div>

      <div className="pageHead mt">
        <span className="badge">Active</span>
        <h1>{visibleTrackings.length} assigned orders</h1>
      </div>
      {visibleTrackings.length ? (
        <section className="stack">{visibleTrackings.map((tracking) => renderTracking(tracking))}</section>
      ) : <EmptyState title="No assigned deliveries" text="Orders assigned to your delivery partner ID will appear here." />}

      <div className="pageHead mt">
        <span className="badge">History</span>
        <h1>{historyTrackings.length} completed or cancelled</h1>
      </div>
      {historyTrackings.length ? (
        <section className="stack">{historyTrackings.map((tracking) => renderTracking(tracking, { readonly: true }))}</section>
      ) : <EmptyState title="No delivery history" text="Delivered and cancelled deliveries will stay here for review." />}
    </main>
  );
}
