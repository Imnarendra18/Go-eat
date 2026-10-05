import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Star } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../api/api";
import EmptyState from "../../components/EmptyState";
import { fallbackFood, fallbackHotel, messageFromError } from "../../utils/app";

const targetLink = (review) =>
  review.targetType === "FOOD" ? `/foods/${review.foodId}` : `/hotels/${review.hotelId}`;

export default function AdminReviews() {
  const [reviews, setReviews] = useState([]);
  const [targets, setTargets] = useState({});
  const [filters, setFilters] = useState({ targetType: "", rating: "" });

  const load = async () => {
    try {
      const { data } = await api.get("/api/reviews");
      const items = data.reviews || [];
      setReviews(items);

      const targetResults = await Promise.allSettled(
        items.map((review) => {
          if (review.targetType === "FOOD" && review.foodId) {
            return api.get(`/api/foods/${review.foodId}`).then((res) => [review._id, res.data.food]);
          }
          if (review.targetType === "HOTEL" && review.hotelId) {
            return api.get(`/api/hotels/${review.hotelId}`).then((res) => [review._id, res.data.hotel]);
          }
          return Promise.resolve([review._id, null]);
        }),
      );

      setTargets(Object.fromEntries(
        targetResults
          .filter((result) => result.status === "fulfilled")
          .map((result) => result.value),
      ));
    } catch (error) {
      toast.error(messageFromError(error, "Could not load reviews"));
    }
  };

  useEffect(() => { load(); }, []);

  const deleteReview = async (review) => {
    try {
      await api.delete(`/api/reviews/${review._id}`);
      setReviews((items) => items.filter((item) => item._id !== review._id));
      toast.success("Review deleted");
    } catch (error) {
      toast.error(messageFromError(error, "Could not delete review"));
    }
  };

  const visibleReviews = useMemo(() => reviews.filter((review) => {
    if (filters.targetType && review.targetType !== filters.targetType) return false;
    if (filters.rating && Number(review.rating) !== Number(filters.rating)) return false;
    return true;
  }), [reviews, filters]);

  const counts = reviews.reduce((acc, review) => {
    acc.total += 1;
    acc[review.targetType] = (acc[review.targetType] || 0) + 1;
    if (Number(review.rating) <= 2) acc.low += 1;
    return acc;
  }, { total: 0, low: 0 });

  const targetTitle = (review) => {
    const target = targets[review._id];
    return review.targetType === "FOOD"
      ? target?.name || "Food review"
      : target?.hotelName || "Hotel review";
  };

  const targetImage = (review) => {
    const target = targets[review._id];
    return target?.image || (review.targetType === "FOOD" ? fallbackFood : fallbackHotel);
  };

  return (
    <main className="page">
      <div className="pageHead">
        <span className="badge">Admin reviews</span>
        <h1>Review management</h1>
        <p className="muted">View all food and hotel reviews, filter them, and delete fake or abusive reviews.</p>
      </div>

      <section className="dashGrid">
        <div className="dashCard">Total reviews <strong>{counts.total}</strong></div>
        <div className="dashCard">Food reviews <strong>{counts.FOOD || 0}</strong></div>
        <div className="dashCard">Hotel reviews <strong>{counts.HOTEL || 0}</strong></div>
        <div className="dashCard">Low ratings <strong>{counts.low}</strong></div>
      </section>

      <div className="filterBar compact">
        <select value={filters.targetType} onChange={(event) => setFilters({ ...filters, targetType: event.target.value })}>
          <option value="">All review types</option>
          <option value="FOOD">FOOD</option>
          <option value="HOTEL">HOTEL</option>
        </select>
        <select value={filters.rating} onChange={(event) => setFilters({ ...filters, rating: event.target.value })}>
          <option value="">All ratings</option>
          {[5, 4, 3, 2, 1].map((rating) => <option key={rating} value={rating}>{rating} star</option>)}
        </select>
        <button className="btn" onClick={load}>Refresh</button>
      </div>

      {visibleReviews.length ? (
        <section className="cards">
          {visibleReviews.map((review) => (
            <article className="foodCard" key={review._id}>
              <Link to={targetLink(review)} className="cardLink">
                <div className="mediaWrap">
                  <img src={targetImage(review)} alt={targetTitle(review)} />
                </div>
                <div className="cardBody">
                  <div className="between">
                    <p className="eyebrow">{review.targetType}</p>
                    <span className="rating"><Star size={14} fill="currentColor" /> {review.rating}</span>
                  </div>
                  <h2>{targetTitle(review)}</h2>
                  <p className="muted clamp">{review.comment || "No comment added."}</p>
                  <div className="miniList">
                    <span>User {review.userName || review.userId}</span>
                    <span>{review.isEdited ? "Edited" : "Original"}</span>
                    <span>{new Date(review.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </Link>
              <div className="cardActions">
                <button className="dangerBtn small" onClick={() => deleteReview(review)}>Delete review</button>
              </div>
            </article>
          ))}
        </section>
      ) : <EmptyState title="No reviews found" text="Reviews will appear here after users rate foods or hotels." />}
    </main>
  );
}
