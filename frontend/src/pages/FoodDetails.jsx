import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Clock, Heart, ShoppingCart, Star, Zap } from "lucide-react";
import toast from "react-hot-toast";
import api from "../api/api";
import EmptyState from "../components/EmptyState";
import FoodCard from "../components/FoodCard";
import { currency, fallbackFood, getUser, messageFromError, toCartItem } from "../utils/app";

const normalizeFoodItem = (selectedFood = {}) => ({
  ...selectedFood,
  _id: selectedFood?._id || selectedFood?.foodId,
  foodId: selectedFood?.foodId || selectedFood?._id,
  name: selectedFood?.name || selectedFood?.foodName,
  foodName: selectedFood?.foodName || selectedFood?.name,
});

export default function FoodDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = getUser();
  const [food, setFood] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [similarFoods, setSimilarFoods] = useState([]);
  const [average, setAverage] = useState({ averageRating: 0, totalReviews: 0 });
  const [review, setReview] = useState({ rating: 5, comment: "" });
  const [addingId, setAddingId] = useState("");
  const [loadingFood, setLoadingFood] = useState(true);
  const [foodMissing, setFoodMissing] = useState(false);

  const loadReviews = useCallback(async () => {
    const { data } = await api.get(`/api/reviews/food/${id}`);
    setReviews(data.reviews || []);
    setAverage(data.average || { averageRating: 0, totalReviews: 0 });
    api.get("/api/reviews/average", { params: { targetType: "FOOD", targetId: id } })
      .then(({ data: averageData }) => setAverage(averageData.average || data.average || { averageRating: 0, totalReviews: 0 }))
      .catch(() => {});
  }, [id]);

  const loadSimilarFoods = useCallback(async (currentFood) => {
    try {
      const { data } = await api.get("/api/foods");
      const allFoods = data.foods || [];
      const response = await api.post("/api/recommendations/similar-foods", {
        currentFood: {
          ...currentFood,
          foodId: currentFood._id,
        },
        foods: allFoods.map((item) => ({
          ...item,
          foodId: item._id,
        })),
        limit: 6,
      });
      setSimilarFoods((response.data.foods || []).map(normalizeFoodItem));
    } catch {
      const fallbackFoods = await api.get("/api/foods")
        .then(({ data }) => (data.foods || [])
          .filter((item) => item._id !== currentFood._id)
          .sort((a, b) => {
            const aCategory = a.category === currentFood.category ? 1 : 0;
            const bCategory = b.category === currentFood.category ? 1 : 0;
            return bCategory - aCategory || Math.abs(Number(a.price) - Number(currentFood.price)) - Math.abs(Number(b.price) - Number(currentFood.price));
          })
          .slice(0, 6))
        .catch(() => []);
      setSimilarFoods(fallbackFoods.map(normalizeFoodItem));
    }
  }, []);

  useEffect(() => {
    setLoadingFood(true);
    setFoodMissing(false);
    setFood(null);
    setSimilarFoods([]);

    api.get(`/api/foods/${id}`)
      .then(({ data }) => {
        setFood(data.food);
        loadSimilarFoods(data.food);
      })
      .catch((error) => {
        setFoodMissing(true);
        toast.error(messageFromError(error, "Food not found"));
      })
      .finally(() => setLoadingFood(false));
    loadReviews().catch(() => {});
  }, [id, loadReviews, loadSimilarFoods]);

  const addToCart = async (selectedFood = food) => {
    const item = normalizeFoodItem(selectedFood || food);
    if (!item?._id || !item.hotelId || !item.name || !item.hotelName || !item.price) {
      toast.error("Food details are incomplete");
      return;
    }

    setAddingId(item._id);
    try {
      await api.post("/api/cart/add", toCartItem(item));
      toast.success("Added to cart");
    } catch (error) {
      toast.error(messageFromError(error, "Login as customer to add cart items"));
    } finally {
      setAddingId("");
    }
  };

  const orderNow = (selectedFood = food) => {
    const item = normalizeFoodItem(selectedFood || food);
    if (!item?._id || !item.hotelId || !item.name || !item.hotelName || !item.price) {
      toast.error("Food details are incomplete");
      return;
    }

    localStorage.setItem("buyNowItem", JSON.stringify(item));
    navigate("/checkout?mode=buy-now");
  };

  const addFavorite = async () => {
    try {
      await api.post("/api/users/favorites/food", { foodId: food._id });
      toast.success("Added to favorite foods");
    } catch (error) {
      toast.error(messageFromError(error, "Could not add favorite"));
    }
  };

  const submitReview = async (event) => {
    event.preventDefault();
    try {
      await api.post("/api/reviews", {
        userName: user?.name || "GoEat user",
        targetType: "FOOD",
        foodId: food._id,
        hotelId: food.hotelId,
        rating: Number(review.rating),
        comment: review.comment,
      });
      toast.success("Review added");
      setReview({ rating: 5, comment: "" });
      loadReviews();
    } catch (error) {
      toast.error(messageFromError(error, "Could not submit review"));
    }
  };

  if (loadingFood) {
    return <main className="page"><p className="muted">Loading food...</p></main>;
  }

  if (foodMissing || !food) {
    return <main className="page"><EmptyState title="Food not found" text="This dish may have been removed or the link is invalid." /></main>;
  }

  return (
    <main className="page">
      <section className="detailHero">
        <img src={food.image || fallbackFood} alt={food.name} />
        <div>
          <span className="badge">{food.category}</span>
          <h1>{food.name}</h1>
          <p className="muted">{food.description || `Freshly prepared by ${food.hotelName}.`}</p>
          <div className="detailMeta">
            <span className="rating"><Star size={17} fill="currentColor" /> {average.averageRating || food.rating || "New"} ({average.totalReviews || 0})</span>
            <span className="meta"><Clock size={16} /> {food.preparationTime || 20} min</span>
            <strong className="price">{currency(food.price)}</strong>
          </div>
          <div className="row wrap mt">
            <button className="btn" onClick={() => addToCart()} disabled={addingId === food._id}><ShoppingCart size={18} /> {addingId === food._id ? "Adding..." : "Add to cart"}</button>
            <button className="btn ghost" onClick={() => orderNow()}><Zap size={18} /> Order now</button>
            <button className="btn ghost" onClick={addFavorite}><Heart size={18} /> Favorite</button>
          </div>
        </div>
      </section>

      <section className="detailGrid">
        <form className="panel" onSubmit={submitReview}>
          <h2>Write a review</h2>
          <div className="grid2">
            <select value={review.rating} onChange={(event) => setReview({ ...review, rating: event.target.value })}>
              {[5, 4, 3, 2, 1].map((rating) => <option key={rating} value={rating}>{rating} star</option>)}
            </select>
            <input placeholder="Your name" value={user?.name || ""} readOnly />
            <textarea className="span2" placeholder="How was it?" value={review.comment} onChange={(event) => setReview({ ...review, comment: event.target.value })} required />
          </div>
          <button className="btn full">Submit review</button>
        </form>
        <section className="panel">
          <h2>People reviews</h2>
          {reviews.length ? (
            <div className="stack">
              {reviews.map((item) => (
                <article className="reviewItem" key={item._id}>
                  <strong>{item.userName || "GoEat user"}</strong>
                  <span className="rating"><Star size={14} fill="currentColor" /> {item.rating}</span>
                  <p>{item.comment}</p>
                </article>
              ))}
            </div>
          ) : <EmptyState title="No reviews yet" text="Be the first person to review this food." />}
        </section>
      </section>

      <div className="pageHead mt">
        <span className="badge">Recommendation service</span>
        <h1>Similar foods</h1>
        <p className="muted">Recommended using category, price, veg preference, and score from the recommendation microservice.</p>
      </div>
      {similarFoods.length ? (
        <section className="cards">
          {similarFoods.map((item) => (
            <div key={item._id || item.foodId}>
              <FoodCard food={normalizeFoodItem(item)} onAdd={addToCart} />
              <div className="cardActions">
                <button className="btn small" onClick={() => addToCart(item)} disabled={addingId === (item._id || item.foodId)}><ShoppingCart size={15} /> {addingId === (item._id || item.foodId) ? "Adding..." : "Add cart"}</button>
                <button className="btn ghost small" onClick={() => orderNow(item)}><Zap size={15} /> Order now</button>
              </div>
            </div>
          ))}
        </section>
      ) : <EmptyState title="No similar foods yet" text="Similar food recommendations will appear when more foods exist." />}
    </main>
  );
}
