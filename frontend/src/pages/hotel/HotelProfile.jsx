import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { MapPin, Phone, Star, Store, Utensils } from "lucide-react";
import EmptyState from "../../components/EmptyState";
import api from "../../api/api";
import { fallbackHotel, getDeviceLocation, getUser, messageFromError, readImageFile } from "../../utils/app";

const blankForm = {
  hotelName: "",
  description: "",
  address: "",
  phone: "",
  image: "",
  cuisines: "",
};

export default function HotelProfile() {
  const user = getUser();
  const ownerId = user?.userId || user?._id;
  const [hotels, setHotels] = useState([]);
  const [hotelId, setHotelId] = useState("");
  const [editing, setEditing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [changeLocation, setChangeLocation] = useState(false);
  const [form, setForm] = useState(blankForm);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get("/api/hotels");
      const mine = (data.hotels || []).filter((hotel) => hotel.ownerId === ownerId);
      setHotels(mine);
      if (!hotelId && mine[0]?._id) setHotelId(mine[0]._id);
    } catch {
      toast.error("Could not load hotel profile");
    }
  }, [hotelId, ownerId]);

  useEffect(() => { load(); }, [load]);

  const selectedHotel = hotels.find((hotel) => hotel._id === hotelId);

  const startEdit = () => {
    if (!selectedHotel) return;
    setForm({
      hotelName: selectedHotel.hotelName || "",
      description: selectedHotel.description || "",
      address: selectedHotel.address || "",
      phone: selectedHotel.phone || "",
      image: selectedHotel.image || "",
      cuisines: (selectedHotel.cuisines || []).join(", "),
    });
    setChangeLocation(false);
    setEditing(true);
    setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" }), 0);
  };

  const startCreate = () => {
    setForm(blankForm);
    setChangeLocation(true);
    setEditing(false);
    setCreating(true);
    setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" }), 0);
  };

  const pickImage = async (event) => {
    setForm({ ...form, image: await readImageFile(event.target.files?.[0]) });
  };

  const save = async (event) => {
    event.preventDefault();
    if (!selectedHotel && !creating) return;

    try {
      let locationPayload = {};
      if (creating || changeLocation) {
        const location = await getDeviceLocation();
        locationPayload = { lat: location.lat, lng: location.lng };
      }

      const payload = {
        ...form,
        ...locationPayload,
        cuisines: form.cuisines.split(",").map((item) => item.trim()).filter(Boolean),
      };

      if (creating) {
        await api.post("/api/hotels", payload);
      } else {
        await api.put(`/api/hotels/${selectedHotel._id}`, payload);
      }

      toast.success(creating ? "Hotel profile created" : "Hotel profile updated");
      setEditing(false);
      setCreating(false);
      setChangeLocation(false);
      load();
    } catch (error) {
      toast.error(messageFromError(error, creating ? "Could not create hotel profile" : "Could not update hotel profile"));
    }
  };

  const removeHotel = async () => {
    if (!selectedHotel) return;
    const confirmed = window.confirm(`Delete ${selectedHotel.hotelName}? This cannot be undone.`);
    if (!confirmed) return;

    try {
      await api.delete(`/api/hotels/${selectedHotel._id}`);
      toast.success("Hotel deleted");
      setHotelId("");
      setHotels([]);
      load();
    } catch (error) {
      toast.error(messageFromError(error, "Could not delete hotel"));
    }
  };

  return (
    <main className="page">
      <div className="pageHead between wrap">
        <div>
          <span className="badge">Hotel profile</span>
          <h1>Your hotel profile</h1>
          <p className="muted">Profile details are shown without exposing latitude or longitude.</p>
        </div>
        {hotels.length > 1 && (
          <select value={hotelId} onChange={(event) => setHotelId(event.target.value)}>
            {hotels.map((hotel) => <option key={hotel._id} value={hotel._id}>{hotel.hotelName}</option>)}
          </select>
        )}
      </div>

      {selectedHotel ? (
        <>
          <section className="detailHero">
            <img src={selectedHotel.image || fallbackHotel} alt={selectedHotel.hotelName} />
            <div>
              <span className={selectedHotel.isOpen ? "pill green" : "pill red"}>{selectedHotel.isOpen ? "Open now" : "Closed"}</span>
              <h1>{selectedHotel.hotelName}</h1>
              <p className="muted">{selectedHotel.description || "No description added yet."}</p>
              <div className="detailMeta">
                <span className="rating"><Star size={17} fill="currentColor" /> {selectedHotel.rating || "New"}</span>
                <span className="meta"><Phone size={16} /> {selectedHotel.phone}</span>
                <span className="meta"><MapPin size={16} /> {selectedHotel.address}</span>
                <span className="meta"><Utensils size={16} /> {(selectedHotel.cuisines || []).join(", ") || "Multi cuisine"}</span>
              </div>
            </div>
          </section>

          <div className="row wrap mt">
            <button className="btn" onClick={startEdit}>Edit hotel profile</button>
            <button className="dangerBtn" onClick={removeHotel}>Delete hotel</button>
          </div>
        </>
      ) : (
        <>
          <EmptyState title="No hotel profile" text="Create your hotel profile here first, then you can add food." />
          <button className="btn mt" onClick={startCreate}>Create hotel profile</button>
        </>
      )}

      {(editing || creating) && (
        <form className="editorGrid mt" onSubmit={save}>
          <div className="panel">
            <h2>{creating ? "Create hotel profile" : "Edit hotel profile"}</h2>
            <div className="grid2">
              <input placeholder="Hotel name" value={form.hotelName} onChange={(event) => setForm({ ...form, hotelName: event.target.value })} required />
              <input placeholder="Phone" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} required />
              <input className="span2" placeholder="Address" value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} required />
              <input className="span2" placeholder="Cuisines comma separated" value={form.cuisines} onChange={(event) => setForm({ ...form, cuisines: event.target.value })} />
              <textarea className="span2" placeholder="Description" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
              <input className="span2" type="file" accept="image/*" onChange={pickImage} />
              {!creating && (
                <select className="span2" value={changeLocation ? "yes" : "no"} onChange={(event) => setChangeLocation(event.target.value === "yes")}>
                  <option value="no">Keep current hotel location</option>
                  <option value="yes">Change hotel location using this device</option>
                </select>
              )}
            </div>
            <p className="muted smallText mt">{creating ? "The browser will ask for device location and save it for the hotel. Coordinates are not shown here." : "If you choose to change location, the browser will ask permission and save this device's current location. Coordinates are not shown here."}</p>
            <button className="btn full">{creating ? "Create hotel profile" : "Save hotel profile"}</button>
          </div>
          <aside className="previewCard">
            <img src={form.image || fallbackHotel} alt="Hotel preview" />
            <h2><Store size={18} /> {form.hotelName || "Hotel preview"}</h2>
            <p>{form.description || "Updated hotel details preview here."}</p>
          </aside>
        </form>
      )}
    </main>
  );
}
