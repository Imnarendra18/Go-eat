import { useCallback, useEffect, useMemo, useState } from "react";
import { MapPin, Navigation, PackagePlus, Truck } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../api/api";
import EmptyState from "../../components/EmptyState";
import { currency, getDeviceLocation, getUser, messageFromError } from "../../utils/app";

const blankAssign = {
  orderId: "",
  deliveryPartnerId: "",
  deliveryPartnerName: "",
  deliveryPartnerPhone: "",
};

const deliveryStatuses = ["ASSIGNED", "PICKED_UP", "ON_THE_WAY", "NEAR_USER", "DELIVERED", "CANCELLED"];
const finishedOrderStatuses = ["DELIVERED", "CANCELLED", "REFUNDED"];
const deliveryToOrderStatus = {
  ASSIGNED: "OUT_FOR_DELIVERY",
  PICKED_UP: "OUT_FOR_DELIVERY",
  ON_THE_WAY: "OUT_FOR_DELIVERY",
  NEAR_USER: "OUT_FOR_DELIVERY",
  DELIVERED: "DELIVERED",
  CANCELLED: "CANCELLED",
};

const statusClass = (status) =>
  status === "DELIVERED" ? "pill green" : status === "CANCELLED" ? "pill red" : "pill orange";

export default function HotelDelivery() {
  const user = getUser();
  const ownerId = user?.userId || user?._id;
  const [hotels, setHotels] = useState([]);
  const [hotelId, setHotelId] = useState("");
  const [orders, setOrders] = useState([]);
  const [trackings, setTrackings] = useState([]);
  const [partners, setPartners] = useState([]);
  const [assign, setAssign] = useState(blankAssign);
  const [etaInputs, setEtaInputs] = useState({});
  const [statusInputs, setStatusInputs] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get("/api/hotels").then(({ data }) => {
      const mine = (data.hotels || []).filter((hotel) => hotel.ownerId === ownerId);
      setHotels(mine);
      if (mine[0]?._id) setHotelId(mine[0]._id);
    }).catch(() => {});
  }, [ownerId]);

  useEffect(() => {
    api.get("/api/auth/delivery-partners")
      .then(({ data }) => setPartners(data.partners || []))
      .catch(() => {});
  }, []);

  const load = useCallback(async () => {
    if (!hotelId) return;
    setLoading(true);
    try {
      const [trackingRes, orderRes] = await Promise.all([
        api.get(`/api/delivery/hotel/${hotelId}`),
        api.get(`/api/orders/hotel/${hotelId}`),
      ]);
      const nextTrackings = trackingRes.data.trackings || [];
      setTrackings(nextTrackings);
      setOrders(orderRes.data.orders || []);
      setEtaInputs(Object.fromEntries(nextTrackings.map((item) => [item.orderId, item.estimatedMinutes ?? ""])));
      setStatusInputs(Object.fromEntries(nextTrackings.map((item) => [item.orderId, item.status || "ASSIGNED"])));
    } catch (error) {
      toast.error(messageFromError(error, "Could not load hotel delivery tracking"));
    } finally {
      setLoading(false);
    }
  }, [hotelId]);

  useEffect(() => { load(); }, [load]);

  const selectedHotel = hotels.find((hotel) => hotel._id === hotelId);
  const trackingByOrderId = useMemo(
    () => new Map(trackings.map((tracking) => [String(tracking.orderId), tracking])),
    [trackings],
  );
  const activeOrders = orders.filter((order) => !finishedOrderStatuses.includes(order.orderStatus));
  const ordersWithoutTracking = activeOrders.filter((order) => !trackingByOrderId.has(String(order._id)));

  const pickTracking = (tracking) => {
    setAssign({
      orderId: tracking.orderId,
      deliveryPartnerId: tracking.deliveryPartnerId || "",
      deliveryPartnerName: tracking.deliveryPartnerName || "",
      deliveryPartnerPhone: tracking.deliveryPartnerPhone || "",
    });
  };

  const pickPartner = (partner) => {
    setAssign({
      ...assign,
      deliveryPartnerId: partner._id,
      deliveryPartnerName: partner.name,
      deliveryPartnerPhone: partner.phone || "",
    });
  };

  const assignPartner = async (event) => {
    event.preventDefault();
    try {
      const { data } = await api.patch(`/api/delivery/order/${assign.orderId}/assign`, {
        deliveryPartnerId: assign.deliveryPartnerId,
        deliveryPartnerName: assign.deliveryPartnerName,
        deliveryPartnerPhone: assign.deliveryPartnerPhone,
      });
      setTrackings((items) => items.map((item) => item.orderId === assign.orderId ? data.tracking : item));
      toast.success("Delivery partner assigned");
      setAssign(blankAssign);
    } catch (error) {
      toast.error(messageFromError(error, "Could not assign delivery partner"));
    }
  };

  const createTracking = async (order) => {
    if (!selectedHotel) {
      toast.error("Select a hotel first");
      return;
    }

    const pickup = {
      lat: Number(selectedHotel.location?.coordinates?.[1]) || 0,
      lng: Number(selectedHotel.location?.coordinates?.[0]) || 0,
    };
    const drop = {
      lat: Number(order.deliveryAddress?.lat) || pickup.lat,
      lng: Number(order.deliveryAddress?.lng) || pickup.lng,
    };

    try {
      const { data } = await api.post("/api/delivery/create", {
        orderId: order._id,
        userId: order.userId,
        hotelId,
        deliveryPartnerId: assign.deliveryPartnerId,
        deliveryPartnerName: assign.deliveryPartnerName,
        deliveryPartnerPhone: assign.deliveryPartnerPhone,
        pickupLocation: pickup,
        dropLocation: drop,
        estimatedMinutes: Number(etaInputs[order._id]) || 30,
      });
      setTrackings((items) => [data.tracking, ...items]);
      setEtaInputs((items) => ({ ...items, [order._id]: data.tracking.estimatedMinutes ?? 30 }));
      setStatusInputs((items) => ({ ...items, [order._id]: data.tracking.status }));
      toast.success("Delivery tracking created");
    } catch (error) {
      toast.error(messageFromError(error, "Could not create tracking"));
    }
  };

  const updateLocation = async (tracking) => {
    try {
      const location = await getDeviceLocation();
      const { data } = await api.patch(`/api/delivery/order/${tracking.orderId}/location`, {
        lat: location.lat,
        lng: location.lng,
        estimatedMinutes: etaInputs[tracking.orderId] === "" ? undefined : Number(etaInputs[tracking.orderId]),
      });
      setTrackings((items) => items.map((item) => item._id === tracking._id ? data.tracking : item));
      toast.success("Live location updated");
    } catch (error) {
      toast.error(messageFromError(error, "Could not update live location"));
    }
  };

  const updateStatus = async (tracking) => {
    try {
      const status = statusInputs[tracking.orderId] || tracking.status;
      const { data } = await api.patch(`/api/delivery/order/${tracking.orderId}/status`, {
        status,
      });
      setTrackings((items) => items.map((item) => item._id === tracking._id ? data.tracking : item));

      const orderStatus = deliveryToOrderStatus[status];
      if (orderStatus) {
        const orderRes = await api.patch(`/api/orders/${tracking.orderId}/status`, { orderStatus });
        setOrders((items) => items.map((item) => item._id === tracking.orderId ? orderRes.data.order : item));
      }

      toast.success("Delivery status updated");
    } catch (error) {
      toast.error(messageFromError(error, "Could not update delivery status"));
    }
  };

  const renderOrderWithoutTracking = (order) => (
    <article className="panel" key={order._id}>
      <div className="between wrap">
        <h2><PackagePlus size={20} /> Order #{String(order._id).slice(-6)}</h2>
        <span className="pill orange">{order.orderStatus}</span>
        <strong>{currency(order.finalAmount)}</strong>
      </div>
      <p className="muted">{order.userName || "Customer"} {order.userPhone ? `- ${order.userPhone}` : ""}</p>
      <div className="miniList">
        {(order.items || [])
          .filter((item) => item.hotelId === hotelId)
          .map((item) => <span key={item._id || item.foodId}>{item.foodName} x {item.quantity}</span>)}
      </div>
      <div className="row wrap mt">
        <input
          style={{ maxWidth: 170 }}
          placeholder="ETA minutes"
          value={etaInputs[order._id] ?? ""}
          onChange={(event) => setEtaInputs({ ...etaInputs, [order._id]: event.target.value })}
        />
        <button className="btn small" onClick={() => createTracking(order)}>
          <PackagePlus size={15} /> Create tracking
        </button>
      </div>
    </article>
  );

  const renderTracking = (item) => (
    <article className="panel" key={item._id}>
      <div className="between wrap">
        <h2><Truck size={20} /> Order #{String(item.orderId).slice(-6)}</h2>
        <span className={statusClass(item.status)}>{item.status}</span>
      </div>
      <p className="muted">Partner: {item.deliveryPartnerName || "Not assigned"} {item.deliveryPartnerPhone ? `- ${item.deliveryPartnerPhone}` : ""}</p>
      <div className="miniList">
        <span>ETA {item.estimatedMinutes ?? "-"} min</span>
        <span>{item.distanceToUserKm ?? "-"} km away</span>
        <span>Current {item.currentLocation?.lat ?? "-"}, {item.currentLocation?.lng ?? "-"}</span>
        <span>Pickup {item.pickupLocation?.lat}, {item.pickupLocation?.lng}</span>
        <span>Drop {item.dropLocation?.lat}, {item.dropLocation?.lng}</span>
        <span>Updated {item.currentLocation?.updatedAt ? new Date(item.currentLocation.updatedAt).toLocaleString() : "-"}</span>
      </div>
      <div className="row wrap mt">
        <input
          style={{ maxWidth: 170 }}
          placeholder="ETA minutes"
          value={etaInputs[item.orderId] ?? ""}
          onChange={(event) => setEtaInputs({ ...etaInputs, [item.orderId]: event.target.value })}
        />
        <button className="btn small" onClick={() => updateLocation(item)}>
          <Navigation size={15} /> Update location
        </button>
        <a
          className="btn ghost small"
          href={`https://www.google.com/maps/dir/?api=1&destination=${item.dropLocation?.lat || ""},${item.dropLocation?.lng || ""}`}
          target="_blank"
          rel="noreferrer"
        >
          <MapPin size={15} /> Route
        </a>
        <select
          value={statusInputs[item.orderId] || item.status}
          onChange={(event) => setStatusInputs({ ...statusInputs, [item.orderId]: event.target.value })}
        >
          {deliveryStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
        </select>
        <button className="btn ghost small" onClick={() => updateStatus(item)}>Save status</button>
        <button className="btn ghost small" onClick={() => pickTracking(item)}>Use for assignment</button>
      </div>
    </article>
  );

  return (
    <main className="page">
      <div className="pageHead">
        <span className="badge">Delivery service</span>
        <h1>Hotel delivery tracking</h1>
        <p className="muted">Create tracking for hotel orders, assign delivery partners, and update live delivery status.</p>
      </div>

      <div className="filterBar compact">
        <select value={hotelId} onChange={(event) => setHotelId(event.target.value)}>
          <option value="">Select hotel</option>
          {hotels.map((hotel) => <option key={hotel._id} value={hotel._id}>{hotel.hotelName}</option>)}
        </select>
        <button className="btn" onClick={load} disabled={loading || !hotelId}>{loading ? "Loading..." : "Refresh"}</button>
      </div>

      <form className="panel" onSubmit={assignPartner}>
        <h2>Assign delivery partner</h2>
        <div className="grid2">
          <input placeholder="Order id" value={assign.orderId} onChange={(event) => setAssign({ ...assign, orderId: event.target.value })} required />
          <select value={assign.deliveryPartnerId} onChange={(event) => {
            const partner = partners.find((item) => item._id === event.target.value);
            if (partner) pickPartner(partner);
            else setAssign({ ...assign, deliveryPartnerId: "" });
          }} required>
            <option value="">Select delivery partner</option>
            {partners.map((partner) => <option key={partner._id} value={partner._id}>{partner.name} - {partner.email}</option>)}
          </select>
          <input placeholder="Partner name" value={assign.deliveryPartnerName} onChange={(event) => setAssign({ ...assign, deliveryPartnerName: event.target.value })} />
          <input placeholder="Partner phone" value={assign.deliveryPartnerPhone} onChange={(event) => setAssign({ ...assign, deliveryPartnerPhone: event.target.value })} />
        </div>
        <button className="btn full">Assign partner</button>
      </form>

      <div className="pageHead mt"><span className="badge">Orders</span><h1>{ordersWithoutTracking.length} need tracking</h1></div>
      {ordersWithoutTracking.length ? (
        <section className="stack">{ordersWithoutTracking.map(renderOrderWithoutTracking)}</section>
      ) : (
        <EmptyState title="No orders need tracking" text="Active orders without tracking will appear here." />
      )}

      {partners.length ? (
        <section className="cards mt">
          {partners.map((partner) => (
            <article className="panel" key={partner._id}>
              <div className="between wrap">
                <h2>{partner.name}</h2>
                <span className="pill green">DELIVERY</span>
              </div>
              <p className="muted">{partner.email}</p>
              <div className="miniList">
                <span>ID {partner._id}</span>
                <span>{partner.isEmailVerified ? "Verified" : "Not verified"}</span>
              </div>
              <button className="btn ghost small" onClick={() => pickPartner(partner)}>Select partner</button>
            </article>
          ))}
        </section>
      ) : null}

      <div className="pageHead mt"><span className="badge">Tracking</span><h1>{trackings.length} records</h1></div>
      {trackings.length ? (
        <section className="stack">{trackings.map(renderTracking)}</section>
      ) : <EmptyState title="No delivery tracking" text="Create tracking from a hotel order first." />}
    </main>
  );
}
