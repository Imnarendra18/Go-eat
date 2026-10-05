import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../api/api";
import FoodCard from "../../components/FoodCard";
import EmptyState from "../../components/EmptyState";
import { fallbackFood, getUser, messageFromError, readImageFile } from "../../utils/app";

const blankForm = {
  hotelId: "",
  hotelName: "",
  name: "",
  description: "",
  price: "",
  category: "",
  image: "",
  isVeg: "true",
  preparationTime: 20,
};

export default function HotelFoods() {
  const user = getUser();
  const ownerId = user?.userId || user?._id;
  const [foods, setFoods] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState("");
  const [imageChanged, setImageChanged] = useState(false);
  const [form, setForm] = useState(blankForm);

  const loadFoods = async () => {
    try {
      const { data } = await api.get("/api/foods/my-foods");
      setFoods(data.foods || []);
    } catch (error) {
      toast.error(messageFromError(error, "Could not load your foods"));
    }
  };

  useEffect(() => {
    loadFoods();
    api.get("/api/hotels").then(({ data }) => {
      const mine = (data.hotels || []).filter((hotel) => hotel.ownerId === ownerId);
      setHotels(mine);
      if (mine[0]?._id) {
        setForm((current) => ({ ...current, hotelId: mine[0]._id, hotelName: mine[0].hotelName }));
      }
    }).catch(() => {});
  }, [ownerId]);

  const chooseHotel = (id) => {
    const hotel = hotels.find((item) => item._id === id);
    setForm({ ...form, hotelId: id, hotelName: hotel?.hotelName || "" });
  };

  const pickImage = async (event) => {
    setForm({ ...form, image: await readImageFile(event.target.files?.[0]) });
    setImageChanged(Boolean(event.target.files?.[0]));
  };

  const resetForm = () => {
    const firstHotel = hotels[0];
    setEditingId("");
    setImageChanged(false);
    setForm({ ...blankForm, hotelId: firstHotel?._id || "", hotelName: firstHotel?.hotelName || "" });
  };

  const submit = async (event) => {
    event.preventDefault();
    const payload = {
      ...form,
      isVeg: form.isVeg === "true",
      price: Number(form.price),
      preparationTime: Number(form.preparationTime),
    };
    if (editingId && !imageChanged) {
      delete payload.image;
    }

    try {
      if (editingId) {
        await api.put(`/api/foods/${editingId}`, payload);
        toast.success("Food updated");
      } else {
        await api.post("/api/foods", payload);
        toast.success("Food added");
      }
      resetForm();
      setFormOpen(false);
      loadFoods();
    } catch (error) {
      toast.error(messageFromError(error, editingId ? "Could not update food" : "Could not add food"));
    }
  };

  const editFood = (food) => {
    setEditingId(food._id);
    setForm({
      hotelId: food.hotelId,
      hotelName: food.hotelName,
      name: food.name || "",
      description: food.description || "",
      price: food.price || "",
      category: food.category || "",
      image: food.image || "",
      isVeg: String(food.isVeg !== false),
      preparationTime: food.preparationTime || 20,
    });
    setImageChanged(false);
    setFormOpen(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const toggle = async (food) => {
    try {
      await api.patch(`/api/foods/${food._id}/availability`);
      loadFoods();
    } catch (error) {
      toast.error(messageFromError(error, "Could not update availability"));
    }
  };

  const remove = async (food) => {
    try {
      await api.delete(`/api/foods/${food._id}`);
      toast.success("Food removed");
      loadFoods();
    } catch (error) {
      toast.error(messageFromError(error, "Could not delete food"));
    }
  };

  return (
    <main className="page">
      <div className="pageHead between wrap">
        <div>
          <span className="badge">Hotel menu</span>
          <h1>Hotel&apos;s Food</h1>
          <p className="muted">Add, update, delete, and control availability from one menu panel.</p>
        </div>
        <button className="btn" disabled={!hotels.length} onClick={() => { resetForm(); setFormOpen((value) => !value); }}>
          {formOpen ? "Close form" : "Add food"}
        </button>
      </div>

      {!hotels.length && (
        <section className="panel">
          <h2>Create hotel profile first</h2>
          <p className="muted">Food items must belong to one of your hotels. Create your hotel profile, then come back here to add food.</p>
          <Link className="btn mt" to="/hotel/profile">Go to hotel profile</Link>
        </section>
      )}

      {formOpen && hotels.length > 0 && (
        <form className="editorGrid" onSubmit={submit}>
          <div className="panel">
            <h2>{editingId ? "Update food" : "Add food"}</h2>
            <div className="grid2">
              <select value={form.hotelId} onChange={(event) => chooseHotel(event.target.value)} required>
                <option value="">Select hotel</option>
                {hotels.map((hotel) => <option value={hotel._id} key={hotel._id}>{hotel.hotelName}</option>)}
              </select>
              <input placeholder="Dish name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
              <input placeholder="Price" type="number" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} required />
              <input placeholder="Category" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} required />
              <select value={form.isVeg} onChange={(event) => setForm({ ...form, isVeg: event.target.value })}>
                <option value="true">Veg</option>
                <option value="false">Non veg</option>
              </select>
              <input placeholder="Prep time" type="number" value={form.preparationTime} onChange={(event) => setForm({ ...form, preparationTime: event.target.value })} />
              <textarea className="span2" placeholder="Description" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
              <input className="span2" type="file" accept="image/*" onChange={pickImage} />
            </div>
            <button className="btn full">{editingId ? "Update food" : "Add food"}</button>
          </div>
          <aside className="previewCard">
            <img src={form.image || fallbackFood} alt="Food preview" />
            <h2>{form.name || "Food preview"}</h2>
            <p>{form.description || "Selected image and food details preview here."}</p>
          </aside>
        </form>
      )}

      {foods.length ? (
        <section className="cards mt">
          {foods.map((food) => (
            <div key={food._id}>
              <FoodCard food={food} />
              <div className="cardActions">
                <button className="btn small" onClick={() => editFood(food)}>Edit</button>
                <button className="btn ghost small" onClick={() => toggle(food)}>{food.isAvailable ? "Mark unavailable" : "Mark available"}</button>
                <button className="dangerBtn small" onClick={() => remove(food)}>Delete</button>
              </div>
            </div>
          ))}
        </section>
      ) : hotels.length > 0 ? <EmptyState title="No foods yet" text="Use Add food to start building your hotel menu." /> : null}
    </main>
  );
}
