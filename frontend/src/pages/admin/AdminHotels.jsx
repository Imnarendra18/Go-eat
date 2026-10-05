import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../../api/api";
import HotelCard from "../../components/HotelCard";
import EmptyState from "../../components/EmptyState";
import { messageFromError } from "../../utils/app";

export default function AdminHotels() {
  const [hotels, setHotels] = useState([]);
  const load = async () => {
    try {
      const { data } = await api.get("/api/admin/hotels");
      setHotels(data.hotels || []);
    } catch (error) {
      toast.error(messageFromError(error, "Could not load hotels"));
    }
  };
  useEffect(() => { load(); }, []);
  const action = async (hotel, kind) => {
    try {
      await api.patch(`/api/admin/hotels/${hotel._id}/${kind}`);
      toast.success(kind === "approve" ? "Hotel approved in database" : "Hotel rejected and deleted");
      load();
    } catch (error) {
      toast.error(messageFromError(error, "Could not update hotel"));
    }
  };
  return (
    <main className="page">
      <div className="pageHead"><span className="badge">Admin</span><h1>Hotel approvals</h1><p className="muted">Approve writes approval status to MongoDB. Reject deletes the hotel from MongoDB.</p></div>
      {hotels.length ? <section className="cards">{hotels.map((hotel) => <div key={hotel._id}><HotelCard hotel={hotel} /><div className="miniList"><span>{hotel.approvalStatus || "PENDING"}</span><span>{hotel.isApproved ? "Approved" : "Not approved"}</span></div><div className="cardActions"><button className="btn small" onClick={() => action(hotel, "approve")}>Approve</button><button className="dangerBtn small" onClick={() => action(hotel, "reject")}>Reject & delete</button></div></div>)}</section> : <EmptyState title="No hotels" />}
    </main>
  );
}
