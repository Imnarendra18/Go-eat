import { useState } from "react";
import toast from "react-hot-toast";
import api from "../../api/api";
import { fallbackHotel, messageFromError, readImageFile } from "../../utils/app";

export default function CreateHotel() {
  const [form, setForm] = useState({ hotelName: "", description: "", address: "", phone: "", cuisines: "", lat: "", lng: "", image: "" });

  const pickImage = async (event) => {
    const dataUrl = await readImageFile(event.target.files?.[0]);
    setForm({ ...form, image: dataUrl });
  };

  const submit = async (event) => {
    event.preventDefault();
    try {
      await api.post("/api/hotels", { ...form, cuisines: form.cuisines.split(",").map((item) => item.trim()).filter(Boolean) });
      toast.success("Hotel created");
      setForm({ hotelName: "", description: "", address: "", phone: "", cuisines: "", lat: "", lng: "", image: "" });
    } catch (error) {
      toast.error(messageFromError(error, "Could not create hotel"));
    }
  };

  return (
    <main className="page">
      <div className="pageHead"><span className="badge">Hotel setup</span><h1>Create hotel</h1></div>
      <form className="editorGrid" onSubmit={submit}>
        <div className="panel">
          <div className="grid2">
            <input placeholder="Hotel name" value={form.hotelName} onChange={(e) => setForm({ ...form, hotelName: e.target.value })} required />
            <input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
            <input className="span2" placeholder="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} required />
            <input placeholder="Latitude" value={form.lat} onChange={(e) => setForm({ ...form, lat: e.target.value })} required />
            <input placeholder="Longitude" value={form.lng} onChange={(e) => setForm({ ...form, lng: e.target.value })} required />
            <input className="span2" placeholder="Cuisines comma separated" value={form.cuisines} onChange={(e) => setForm({ ...form, cuisines: e.target.value })} />
            <textarea className="span2" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <input className="span2" type="file" accept="image/*" onChange={pickImage} />
          </div>
          <button className="btn full">Create hotel</button>
        </div>
        <aside className="previewCard">
          <img src={form.image || fallbackHotel} alt="Hotel preview" />
          <h2>{form.hotelName || "Hotel preview"}</h2>
          <p>{form.description || "Your uploaded image and details appear here before submission."}</p>
        </aside>
      </form>
    </main>
  );
}
