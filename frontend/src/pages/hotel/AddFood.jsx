import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../../api/api";
import { fallbackFood, getUser, messageFromError, readImageFile } from "../../utils/app";

export default function AddFood() {
  const user = getUser();
  const ownerId = user?.userId || user?._id;
  const [hotels, setHotels] = useState([]);
  const [form, setForm] = useState({ hotelId: "", hotelName: "", name: "", description: "", price: "", category: "", image: "", isVeg: "true", preparationTime: 20 });

  useEffect(() => {
    api.get("/api/hotels").then(({ data }) => {
      const mine = (data.hotels || []).filter((hotel) => hotel.ownerId === ownerId);
      setHotels(mine.length ? mine : data.hotels || []);
    }).catch(() => {});
  }, [ownerId]);

  const chooseHotel = (id) => {
    const hotel = hotels.find((item) => item._id === id);
    setForm({ ...form, hotelId: id, hotelName: hotel?.hotelName || "" });
  };

  const pickImage = async (event) => setForm({ ...form, image: await readImageFile(event.target.files?.[0]) });

  const submit = async (event) => {
    event.preventDefault();
    try {
      await api.post("/api/foods", { ...form, isVeg: form.isVeg === "true", price: Number(form.price), preparationTime: Number(form.preparationTime) });
      toast.success("Food added");
      setForm({ ...form, name: "", description: "", price: "", category: "", image: "" });
    } catch (error) {
      toast.error(messageFromError(error, "Could not add food"));
    }
  };

  return (
    <main className="page">
      <div className="pageHead"><span className="badge">Menu builder</span><h1>Add food</h1></div>
      <form className="editorGrid" onSubmit={submit}>
        <div className="panel">
          <div className="grid2">
            <select value={form.hotelId} onChange={(e) => chooseHotel(e.target.value)} required>
              <option value="">Select hotel</option>
              {hotels.map((hotel) => <option value={hotel._id} key={hotel._id}>{hotel.hotelName}</option>)}
            </select>
            <input placeholder="Dish name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <input placeholder="Price" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
            <input placeholder="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} required />
            <select value={form.isVeg} onChange={(e) => setForm({ ...form, isVeg: e.target.value })}><option value="true">Veg</option><option value="false">Non veg</option></select>
            <input placeholder="Prep time" type="number" value={form.preparationTime} onChange={(e) => setForm({ ...form, preparationTime: e.target.value })} />
            <textarea className="span2" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <input className="span2" type="file" accept="image/*" onChange={pickImage} />
          </div>
          <button className="btn full">Add food</button>
        </div>
        <aside className="previewCard">
          <img src={form.image || fallbackFood} alt="Food preview" />
          <h2>{form.name || "Food preview"}</h2>
          <p>{form.description || "Local images are converted for the backend image field."}</p>
        </aside>
      </form>
    </main>
  );
}
