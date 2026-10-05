import { useEffect, useState } from "react";
import { Truck } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../api/api";
import EmptyState from "../../components/EmptyState";
import { messageFromError } from "../../utils/app";

const blankAssign = {
  orderId: "",
  deliveryPartnerId: "",
  deliveryPartnerName: "",
  deliveryPartnerPhone: "",
};

export default function AdminDelivery() {
  const [trackings, setTrackings] = useState([]);
  const [partners, setPartners] = useState([]);
  const [partnerId, setPartnerId] = useState("");
  const [partnerTrackings, setPartnerTrackings] = useState([]);
  const [assign, setAssign] = useState(blankAssign);
  const [statusFilter, setStatusFilter] = useState("");

  const loadAll = async () => {
    try {
      const { data } = await api.get("/api/delivery/all");
      setTrackings(data.trackings || []);
    } catch (error) {
      toast.error(messageFromError(error, "Could not load delivery tracking"));
    }
  };

  useEffect(() => {
    loadAll();
    api.get("/api/auth/delivery-partners")
      .then(({ data }) => setPartners(data.partners || []))
      .catch(() => {});
  }, []);

  const assignPartner = async (event) => {
    event.preventDefault();
    try {
      await api.patch(`/api/delivery/order/${assign.orderId}/assign`, {
        deliveryPartnerId: assign.deliveryPartnerId,
        deliveryPartnerName: assign.deliveryPartnerName,
        deliveryPartnerPhone: assign.deliveryPartnerPhone,
      });
      toast.success("Delivery partner assigned");
      setAssign(blankAssign);
      loadAll();
    } catch (error) {
      toast.error(messageFromError(error, "Could not assign delivery partner"));
    }
  };

  const loadPartner = async (event) => {
    event.preventDefault();
    try {
      const { data } = await api.get(`/api/delivery/partner/${partnerId}`);
      setPartnerTrackings(data.trackings || []);
    } catch (error) {
      toast.error(messageFromError(error, "Could not load partner orders"));
    }
  };

  const pickTracking = (tracking) => {
    setAssign({
      orderId: tracking.orderId,
      deliveryPartnerId: tracking.deliveryPartnerId || "",
      deliveryPartnerName: tracking.deliveryPartnerName || "",
      deliveryPartnerPhone: tracking.deliveryPartnerPhone || "",
    });
  };

  const pickPartner = (partner) => {
    setPartnerId(partner._id);
    setAssign({
      ...assign,
      deliveryPartnerId: partner._id,
      deliveryPartnerName: partner.name,
      deliveryPartnerPhone: partner.phone || "",
    });
  };

  const visibleTrackings = statusFilter
    ? trackings.filter((item) => item.status === statusFilter)
    : trackings;

  const renderTracking = (item) => (
    <article className="panel" key={item._id}>
      <div className="between wrap">
        <h2><Truck size={20} /> Order #{String(item.orderId).slice(-6)}</h2>
        <span className="pill orange">{item.status}</span>
      </div>
      <p className="muted">Hotel {item.hotelId} · User {item.userId}</p>
      <p className="muted">Partner: {item.deliveryPartnerName || "Not assigned"} {item.deliveryPartnerPhone ? `· ${item.deliveryPartnerPhone}` : ""}</p>
      <div className="miniList">
        <span>ETA {item.estimatedMinutes ?? "-"} min</span>
        <span>{item.distanceToUserKm ?? "-"} km away</span>
        <span>Current {item.currentLocation?.lat ?? "-"}, {item.currentLocation?.lng ?? "-"}</span>
      </div>
      <button className="btn ghost small" onClick={() => pickTracking(item)}>Use for assignment</button>
    </article>
  );

  return (
    <main className="page">
      <div className="pageHead">
        <span className="badge">Delivery service</span>
        <h1>Admin delivery tracking</h1>
        <p className="muted">Monitor all delivery tracking records, assign partners, and inspect partner orders.</p>
      </div>

      <div className="checkoutGrid">
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

        <form className="panel" onSubmit={loadPartner}>
          <h2>Partner orders</h2>
          <input placeholder="Delivery partner id" value={partnerId} onChange={(event) => setPartnerId(event.target.value)} required />
          <button className="btn full">Find partner orders</button>
        </form>
      </div>

      {partners.length ? (
        <>
          <div className="pageHead mt"><span className="badge">Partners</span><h1>{partners.length} delivery partners</h1></div>
          <section className="cards">
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
                <div className="row wrap mt">
                  <button className="btn ghost small" onClick={() => pickPartner(partner)}>Select partner</button>
                  <button className="btn small" onClick={() => {
                    setPartnerId(partner._id);
                    api.get(`/api/delivery/partner/${partner._id}`)
                      .then(({ data }) => setPartnerTrackings(data.trackings || []))
                      .catch((error) => toast.error(messageFromError(error, "Could not load partner orders")));
                  }}>View orders</button>
                </div>
              </article>
            ))}
          </section>
        </>
      ) : null}

      {partnerTrackings.length ? (
        <>
          <div className="pageHead mt"><span className="badge">Partner</span><h1>{partnerTrackings.length} active partner orders</h1></div>
          <section className="stack">{partnerTrackings.map(renderTracking)}</section>
        </>
      ) : null}

      <div className="pageHead mt between wrap">
        <div><span className="badge">All tracking</span><h1>{visibleTrackings.length} records</h1></div>
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
          <option value="">All statuses</option>
          {["ASSIGNED", "PICKED_UP", "ON_THE_WAY", "NEAR_USER", "DELIVERED", "CANCELLED"].map((status) => <option key={status}>{status}</option>)}
        </select>
      </div>

      {visibleTrackings.length ? <section className="stack">{visibleTrackings.map(renderTracking)}</section> : <EmptyState title="No delivery records" text="Tracking records will appear after hotels create tracking." />}
    </main>
  );
}
