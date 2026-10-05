import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../api/api";
import EmptyState from "../components/EmptyState";
import HotelCard from "../components/HotelCard";
import { messageFromError } from "../utils/app";

export default function Hotels() {
  const [hotels, setHotels] = useState([]);

  useEffect(() => {
    api.get("/api/hotels")
      .then(({ data }) => setHotels(data.hotels || []))
      .catch((error) => toast.error(messageFromError(error, "Failed to load hotels")));
  }, []);

  return (
    <main className="page">
      <div className="pageHead">
        <span className="badge">Restaurants</span>
        <h1>Hotels serving on GoEat</h1>
      </div>
      {hotels.length ? <section className="cards">{hotels.map((hotel) => <HotelCard key={hotel._id} hotel={hotel} />)}</section> : <EmptyState title="No hotels yet" text="Create one from the hotel dashboard." />}
    </main>
  );
}
