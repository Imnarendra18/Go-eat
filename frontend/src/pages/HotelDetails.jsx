import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Heart, MapPin, ShoppingCart, Star, Store, Zap } from "lucide-react";
import toast from "react-hot-toast";
import api from "../api/api";
import EmptyState from "../components/EmptyState";
import FoodCard from "../components/FoodCard";
import { fallbackHotel, messageFromError } from "../utils/app";

export default function HotelDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [hotel, setHotel] = useState(null);
  const [foods, setFoods] = useState([]);
  const [average, setAverage] = useState({ averageRating: 0, totalReviews: 0 });

  useEffect(() => {
    api.get(`/api/hotels/${id}`)
      .then(({ data }) => setHotel(data.hotel))
      .catch((error) => toast.error(messageFromError(error, "Hotel not found")));
    api.get(`/api/foods/hotel/${id}`)
      .then(({ data }) => setFoods(data.foods || []))
      .catch(() => {});
    api.get(`/api/reviews/hotel/${id}`)
      .then(({ data }) => setAverage(data.average || { averageRating: 0, totalReviews: 0 }))
      .catch(() => {});
    api.get("/api/reviews/average", { params: { targetType: "HOTEL", targetId: id } })
      .then(({ data }) => setAverage(data.average || { averageRating: 0, totalReviews: 0 }))
      .catch(() => {});
  }, [id]);

  const addToCart = async (food) => {
    try {
      await api.post("/api/cart/add", {
        foodId: food._id,
        hotelId: food.hotelId,
        foodName: food.name,
        hotelName: food.hotelName,
        image: food.image,
        price: food.price,
        quantity: 1,
      });
      toast.success("Added to cart");
    } catch (error) {
      toast.error(messageFromError(error, "Login as customer to add cart items"));
    }
  };

  const orderFirst = () => {
    if (!foods[0]) return;
    localStorage.setItem("buyNowItem", JSON.stringify(foods[0]));
    navigate("/checkout?mode=buy-now");
  };

  const addFavorite = async () => {
    try {
      await api.post("/api/users/favorites/hotel", { hotelId: hotel._id });
      toast.success("Added to favorite hotels");
    } catch (error) {
      toast.error(messageFromError(error, "Could not add favorite"));
    }
  };

  if (!hotel) {
    return <main className="page"><p className="muted">Loading hotel...</p></main>;
  }

  return (
    <main className="page">
      <section className="detailHero">
        <img src={hotel.image || fallbackHotel} alt={hotel.hotelName} />
        <div>
          <span className={hotel.isOpen ? "pill green" : "pill red"}>{hotel.isOpen ? "Open now" : "Closed"}</span>
          <h1>{hotel.hotelName}</h1>
          <p className="muted">{hotel.description || (hotel.cuisines || []).join(", ")}</p>
          <div className="detailMeta">
            <span className="rating"><Star size={17} fill="currentColor" /> {average.averageRating || hotel.rating || "New"} ({average.totalReviews || 0})</span>
            <span className="meta"><MapPin size={16} /> {hotel.address}</span>
            <span className="meta"><Store size={16} /> {foods.length} foods</span>
          </div>
          <div className="row wrap mt">
            {foods[0] && <button className="btn" onClick={orderFirst}><Zap size={18} /> Order popular item</button>}
            <button className="btn ghost" onClick={addFavorite}><Heart size={18} /> Favorite hotel</button>
          </div>
        </div>
      </section>

      <div className="pageHead mt">
        <span className="badge">Menu</span>
        <h1>{foods.length} foods from this hotel</h1>
      </div>
      {foods.length ? (
        <section className="cards">
          {foods.map((food) => (
            <div key={food._id}>
              <FoodCard food={food} onAdd={addToCart} />
              <div className="cardActions">
                <button className="btn small" onClick={() => addToCart(food)}><ShoppingCart size={15} /> Add cart</button>
                <button className="btn ghost small" onClick={() => { localStorage.setItem("buyNowItem", JSON.stringify(food)); navigate("/checkout?mode=buy-now"); }}>Order now</button>
              </div>
            </div>
          ))}
        </section>
      ) : <EmptyState title="No foods in this hotel" text="This hotel has not added menu items yet." />}
    </main>
  );
}
