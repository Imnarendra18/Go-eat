import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../api/api";
import EmptyState from "../../components/EmptyState";
import { getUser, messageFromError } from "../../utils/app";

export default function HotelReviews() {
  const user = getUser();
  const ownerId = user?.userId || user?._id;
  const [hotels, setHotels] = useState([]);
  const [hotelId, setHotelId] = useState("");
  const [foods, setFoods] = useState([]);
  const [hotelReviews, setHotelReviews] = useState([]);
  const [foodReviews, setFoodReviews] = useState([]);
  const [average, setAverage] = useState({ averageRating: 0, totalReviews: 0 });

  useEffect(() => {
    api.get("/api/hotels").then(({ data }) => {
      const mine = (data.hotels || []).filter((hotel) => hotel.ownerId === ownerId);
      setHotels(mine);
      if (mine[0]?._id) setHotelId(mine[0]._id);
    }).catch(() => {});
  }, [ownerId]);

  useEffect(() => {
    const load = async () => {
      if (!hotelId) return;
      try {
        const [{ data: foodData }, { data: reviewData }] = await Promise.all([
          api.get(`/api/foods/hotel/${hotelId}`),
          api.get(`/api/reviews/hotel/${hotelId}`),
        ]);

        const hotelFoods = foodData.foods || [];
        setFoods(hotelFoods);
        setHotelReviews(reviewData.reviews || []);
        setAverage(reviewData.average || { averageRating: 0, totalReviews: 0 });

        const foodReviewResults = await Promise.allSettled(
          hotelFoods.map((food) =>
            api.get(`/api/reviews/food/${food._id}`).then((res) => ({
              food,
              average: res.data.average,
              reviews: res.data.reviews || [],
            })),
          ),
        );

        setFoodReviews(
          foodReviewResults
            .filter((result) => result.status === "fulfilled")
            .map((result) => result.value),
        );
      } catch (error) {
        toast.error(messageFromError(error, "Could not load hotel reviews"));
      }
    };
    load();
  }, [hotelId]);

  const allFoodReviewCount = foodReviews.reduce((sum, item) => sum + item.reviews.length, 0);

  const renderReview = (review) => (
    <article className="reviewItem" key={review._id}>
      <div className="between wrap">
        <strong>{review.userName || "GoEat user"}</strong>
        <span className="rating"><Star size={14} fill="currentColor" /> {review.rating}</span>
      </div>
      <p>{review.comment || "No comment added."}</p>
      <p className="smallText">{new Date(review.createdAt).toLocaleString()}</p>
    </article>
  );

  return (
    <main className="page">
      <div className="pageHead">
        <span className="badge">Review service</span>
        <h1>Hotel reviews</h1>
        <p className="muted">See reviews for your hotel profile and for every food item in your menu.</p>
      </div>

      <div className="filterBar compact">
        <select value={hotelId} onChange={(event) => setHotelId(event.target.value)}>
          {hotels.map((hotel) => <option key={hotel._id} value={hotel._id}>{hotel.hotelName}</option>)}
        </select>
      </div>

      <section className="dashGrid">
        <div className="dashCard">Hotel rating <strong>{average.averageRating || "New"}</strong></div>
        <div className="dashCard">Hotel reviews <strong>{hotelReviews.length}</strong></div>
        <div className="dashCard">Food items <strong>{foods.length}</strong></div>
        <div className="dashCard">Food reviews <strong>{allFoodReviewCount}</strong></div>
      </section>

      <div className="pageHead mt">
        <span className="badge">Hotel</span>
        <h1>Reviews for this hotel</h1>
      </div>
      {hotelReviews.length ? (
        <section className="stack">{hotelReviews.map(renderReview)}</section>
      ) : <EmptyState title="No hotel reviews" text="Hotel reviews will appear here when users review your hotel." />}

      <div className="pageHead mt">
        <span className="badge">Foods</span>
        <h1>Food item reviews</h1>
      </div>
      {foodReviews.some((item) => item.reviews.length) ? (
        <section className="stack">
          {foodReviews.filter((item) => item.reviews.length).map((item) => (
            <article className="panel" key={item.food._id}>
              <div className="between wrap">
                <h2>{item.food.name}</h2>
                <span className="rating"><Star size={15} fill="currentColor" /> {item.average?.averageRating || "New"} ({item.reviews.length})</span>
              </div>
              <div className="stack mt">
                {item.reviews.map(renderReview)}
              </div>
            </article>
          ))}
        </section>
      ) : <EmptyState title="No food reviews" text="Food reviews will appear here when users review your dishes." />}
    </main>
  );
}
