import { MapPin, Star, Store } from "lucide-react";
import { Link } from "react-router-dom";
import { fallbackHotel } from "../utils/app";

export default function HotelCard({ hotel }) {
  return (
    <article className="hotelCard">
      <Link to={`/hotels/${hotel._id}`} className="cardLink">
        <img src={hotel.image || fallbackHotel} alt={hotel.hotelName} />
        <div className="cardBody">
          <div className="between">
            <span className={hotel.isOpen ? "pill green" : "pill red"}>
              {hotel.isOpen ? "Open now" : "Closed"}
            </span>
            <span className="rating">
              <Star size={14} fill="currentColor" /> {hotel.rating || "4.6"}
            </span>
          </div>
          <h2>{hotel.hotelName}</h2>
          <p className="muted clamp">{hotel.description || hotel.cuisines?.join(", ")}</p>
          <p className="meta">
            <MapPin size={15} /> {hotel.address}
          </p>
          <p className="meta">
            <Store size={15} /> {(hotel.cuisines || []).join(", ") || "Multi cuisine"}
          </p>
        </div>
      </Link>
    </article>
  );
}
