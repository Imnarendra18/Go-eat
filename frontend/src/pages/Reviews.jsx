import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Star } from "lucide-react";
import toast from "react-hot-toast";
import api from "../api/api";
import EmptyState from "../components/EmptyState";
import { fallbackFood, fallbackHotel, messageFromError } from "../utils/app";

export default function Reviews() {
  const [reviews, setReviews] = useState([]);
  const [targets, setTargets] = useState({});
  const [editingId, setEditingId] = useState("");
  const [form, setForm] = useState({ rating: 5, comment: "" });

  const load = async () => {
    try {
      const { data } = await api.get("/api/reviews/my-reviews");
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
      toast.error(messageFromError(error, "Could not load your reviews"));
    }
  };

  useEffect(() => { load(); }, []);

  const startEdit = (review) => {
    setEditingId(review._id);
    setForm({ rating: review.rating || 5, comment: review.comment || "" });
  };

  const cancelEdit = () => {
    setEditingId("");
    setForm({ rating: 5, comment: "" });
  };

  const saveReview = async (review) => {
    try {
      await api.put(`/api/reviews/${review._id}`, {
        rating: Number(form.rating),
        comment: form.comment,
      });
      toast.success("Review updated");
      cancelEdit();
      load();
    } catch (error) {
      toast.error(messageFromError(error, "Could not update review"));
    }
  };

  const deleteReview = async (review) => {
    try {
      await api.delete(`/api/reviews/${review._id}`);
      setReviews((items) => items.filter((item) => item._id !== review._id));
      toast.success("Review deleted");
    } catch (error) {
      toast.error(messageFromError(error, "Could not delete review"));
    }
  };

  const targetLink = (review) =>
    review.targetType === "FOOD" ? `/foods/${review.foodId}` : `/hotels/${review.hotelId}`;

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
        <span className="badge">Review service</span>
        <h1>My reviews</h1>
        <p className="muted">Edit or delete reviews you posted for foods and hotels.</p>
      </div>

      {reviews.length ? (
        <section className="cards">
          {reviews.map((review) => (
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
                  <p className="smallText">{review.isEdited ? "Edited" : "Original"} · {new Date(review.createdAt).toLocaleDateString()}</p>
                </div>
              </Link>

              <div className="cardActions">
                <button className="btn small" onClick={() => startEdit(review)}>Edit</button>
                <button className="dangerBtn small" onClick={() => deleteReview(review)}>Delete</button>
              </div>

              {editingId === review._id && (
                <div className="panel mt">
                  <h2>Edit review</h2>
                  <select value={form.rating} onChange={(event) => setForm({ ...form, rating: event.target.value })}>
                    {[5, 4, 3, 2, 1].map((rating) => <option key={rating} value={rating}>{rating} star</option>)}
                  </select>
                  <textarea className="mt" value={form.comment} onChange={(event) => setForm({ ...form, comment: event.target.value })} />
                  <div className="row wrap mt">
                    <button className="btn small" onClick={() => saveReview(review)}>Save review</button>
                    <button className="btn ghost small" onClick={cancelEdit}>Cancel</button>
                  </div>
                </div>
              )}
            </article>
          ))}
        </section>
      ) : <EmptyState title="No reviews yet" text="Reviews you write on food detail pages will appear here." />}
    </main>
  );
}
