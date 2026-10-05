import { useEffect, useState } from "react";
import { Camera, Heart, MapPin, ShieldCheck, SlidersHorizontal, User } from "lucide-react";
import toast from "react-hot-toast";
import api from "../api/api";
import EmptyState from "../components/EmptyState";
import { getDeviceLocation, getUser, messageFromError, saveSession } from "../utils/app";

const emptyAddress = {
  label: "",
  fullAddress: "",
  city: "",
  state: "",
  pincode: "",
  phone: "",
  lat: "",
  lng: "",
  isDefault: false,
};

export default function Profile() {
  const [user, setUser] = useState(getUser());
  const [profile, setProfile] = useState(null);
  const [profileForm, setProfileForm] = useState({ name: "", email: "", phone: "", profileImage: "" });
  const [address, setAddress] = useState(emptyAddress);
  const [editingAddressId, setEditingAddressId] = useState("");
  const [preferences, setPreferences] = useState({ vegOnly: false, favoriteCuisines: "", spiceLevel: "MEDIUM" });
  const [activeSection, setActiveSection] = useState("account");

  const load = async () => {
    try {
      const [{ data: authData }, { data: profileData }] = await Promise.all([
        api.get("/api/auth/me"),
        api.get("/api/users/profile"),
      ]);
      setUser(authData.user);
      saveSession(localStorage.getItem("token"), authData.user);
      setProfile(profileData.profile);
      setProfileForm({
        name: profileData.profile?.name || authData.user?.name || "",
        email: profileData.profile?.email || authData.user?.email || "",
        phone: profileData.profile?.phone || "",
        profileImage: profileData.profile?.profileImage || "",
      });
      setPreferences({
        vegOnly: profileData.profile?.preferences?.vegOnly || false,
        favoriteCuisines: (profileData.profile?.preferences?.favoriteCuisines || []).join(", "),
        spiceLevel: profileData.profile?.preferences?.spiceLevel || "MEDIUM",
      });
    } catch (error) {
      toast.error(messageFromError(error, "Could not load profile"));
    }
  };

  useEffect(() => { load(); }, []);

  const updateProfile = async (event) => {
    event.preventDefault();
    try {
      const { data } = await api.put("/api/users/profile", profileForm);
      setProfile(data.profile);
      toast.success("Profile updated");
    } catch (error) {
      toast.error(messageFromError(error, "Could not update profile"));
    }
  };

  const useCurrentLocation = async () => {
    try {
      const location = await getDeviceLocation();
      setAddress((current) => ({ ...current, ...location }));
      await api.put("/api/auth/location", location);
      toast.success("Location captured");
    } catch {
      toast.error("Location permission was not allowed");
    }
  };

  const saveAddress = async (event) => {
    event.preventDefault();
    try {
      const { data } = editingAddressId
        ? await api.put(`/api/users/address/${editingAddressId}`, address)
        : await api.post("/api/users/address", address);
      setProfile(data.profile);
      setAddress(emptyAddress);
      setEditingAddressId("");
      toast.success(editingAddressId ? "Address updated" : "Address added");
    } catch (error) {
      toast.error(messageFromError(error, editingAddressId ? "Could not update address" : "Could not add address"));
    }
  };

  const editAddress = (item) => {
    setActiveSection("address");
    setEditingAddressId(item._id);
    setAddress({
      label: item.label || "",
      fullAddress: item.fullAddress || "",
      city: item.city || "",
      state: item.state || "",
      pincode: item.pincode || "",
      phone: item.phone || "",
      lat: item.location?.coordinates?.[1] || "",
      lng: item.location?.coordinates?.[0] || "",
      isDefault: Boolean(item.isDefault),
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelAddressEdit = () => {
    setEditingAddressId("");
    setAddress(emptyAddress);
  };

  const setDefaultAddress = async (addressId) => {
    try {
      const { data } = await api.patch(`/api/users/address/${addressId}/default`);
      setProfile(data.profile);
      toast.success("Default address updated");
    } catch (error) {
      toast.error(messageFromError(error, "Could not set default address"));
    }
  };

  const deleteAddress = async (addressId) => {
    try {
      const { data } = await api.delete(`/api/users/address/${addressId}`);
      setProfile(data.profile);
      toast.success("Address deleted");
    } catch (error) {
      toast.error(messageFromError(error, "Could not delete address"));
    }
  };

  const updatePreferences = async (event) => {
    event.preventDefault();
    try {
      const { data } = await api.put("/api/users/preferences", {
        vegOnly: preferences.vegOnly,
        favoriteCuisines: preferences.favoriteCuisines.split(",").map((item) => item.trim()).filter(Boolean),
        spiceLevel: preferences.spiceLevel,
      });
      setProfile(data.profile);
      toast.success("Preferences saved");
    } catch (error) {
      toast.error(messageFromError(error, "Could not save preferences"));
    }
  };

  const initials = (profileForm.name || user?.name || "GE")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const addressCount = profile?.addresses?.length || 0;
  const defaultAddress = profile?.addresses?.find((item) => item.isDefault);
  const showAccount = activeSection === "account";
  const showAddress = activeSection === "address";
  const showTaste = activeSection === "taste";

  return (
    <main className="page">
      <div className="profile-heading">
        <div>
          <span className="badge">Profile</span>
          <h1>{user?.name || "Your profile"}</h1>
          <p className="muted">{user?.email} - {user?.role}</p>
        </div>
        <span className="profile-role-pill">
          <ShieldCheck size={16} /> GoEat member
        </span>
      </div>

      <div className="profile-layout">
        <aside className="profile-card">
          <div className="profile-cover" />
          <div className="profile-identity">
            <div className="profile-avatar-wrap">
              {profileForm.profileImage ? (
                <img className="profile-avatar profile-avatar-image" src={profileForm.profileImage} alt={profileForm.name || "Profile"} />
              ) : (
                <div className="profile-avatar">{initials}</div>
              )}
              <span className="avatar-edit" title="Profile image URL is editable in the form">
                <Camera size={16} />
              </span>
            </div>
            <div className="profile-name">{profileForm.name || user?.name || "GoEat User"}</div>
            <div className="profile-role">{user?.role || "USER"}</div>
            <p className="profile-mini-bio">
              Manage your account, delivery addresses, and food preferences without changing checkout behavior.
            </p>
          </div>
          <div className="profile-meta-list">
            <div>
              <span>Addresses</span>
              <strong>{addressCount}</strong>
            </div>
            <div>
              <span>Default</span>
              <strong>{defaultAddress ? "Set" : "No"}</strong>
            </div>
            <div>
              <span>Food type</span>
              <strong>{preferences.vegOnly ? "Veg" : "All"}</strong>
            </div>
            <div>
              <span>Spice</span>
              <strong>{preferences.spiceLevel === "LOW" ? "Mild" : preferences.spiceLevel === "HIGH" ? "Hot" : "Medium"}</strong>
            </div>
          </div>
        </aside>

        <section className="profile-main-stack">
          <div className="profile-stepper" aria-label="Profile sections" role="tablist">
            <button type="button" className={showAccount ? "active" : ""} onClick={() => setActiveSection("account")} role="tab" aria-selected={showAccount}>
              <span>1</span> Account
            </button>
            <button type="button" className={showAddress ? "active" : ""} onClick={() => setActiveSection("address")} role="tab" aria-selected={showAddress}>
              <span>2</span> Address
            </button>
            <button type="button" className={showTaste ? "active" : ""} onClick={() => setActiveSection("taste")} role="tab" aria-selected={showTaste}>
              <span>3</span> Taste
            </button>
          </div>

          {showAccount && <form className="profile-form-card" onSubmit={updateProfile}>
            <div className="profile-form-header">
              <div>
                <h2>Profile settings</h2>
                <span>Basic account information used across GoEat.</span>
              </div>
              <User size={20} />
            </div>
            <div className="profile-form-body">
              <div className="profile-form-grid">
                <label className="profile-field">
                  <span>Name</span>
                  <input placeholder="Name" value={profileForm.name} onChange={(event) => setProfileForm({ ...profileForm, name: event.target.value })} />
                </label>
                <label className="profile-field">
                  <span>Email</span>
                  <input placeholder="Email" value={profileForm.email} onChange={(event) => setProfileForm({ ...profileForm, email: event.target.value })} />
                </label>
                <label className="profile-field">
                  <span>Phone</span>
                  <input placeholder="Phone" value={profileForm.phone} onChange={(event) => setProfileForm({ ...profileForm, phone: event.target.value })} />
                </label>
                <label className="profile-field">
                  <span>Profile image</span>
                  <input placeholder="Profile image URL/data" value={profileForm.profileImage} onChange={(event) => setProfileForm({ ...profileForm, profileImage: event.target.value })} />
                </label>
              </div>
              <div className="profile-actions">
                <button className="btn">Save profile</button>
              </div>
            </div>
          </form>}

          {showAddress && <div className="profile-secondary-grid profile-secondary-grid-address">
          <form className="profile-form-card" onSubmit={saveAddress}>
            <div className="profile-form-header">
              <div>
                <h2>{editingAddressId ? "Edit delivery address" : "Add delivery address"}</h2>
                <span>These addresses remain connected to checkout and delivery.</span>
              </div>
              <MapPin size={20} />
            </div>
            <div className="profile-form-body">
              <div className="profile-address-toolbar">
                <button type="button" className="btn ghost small" onClick={useCurrentLocation}>Use device location</button>
                {editingAddressId && <button type="button" className="dangerBtn small" onClick={cancelAddressEdit}>Cancel edit</button>}
              </div>
              <div className="profile-form-grid">
                <label className="profile-field">
                  <span>Label</span>
                  <input placeholder="Label, e.g. Home" value={address.label} onChange={(event) => setAddress({ ...address, label: event.target.value })} />
                </label>
                <label className="profile-field">
                  <span>Phone</span>
                  <input placeholder="Phone" value={address.phone} onChange={(event) => setAddress({ ...address, phone: event.target.value })} />
                </label>
                <label className="profile-field full">
                  <span>Full address</span>
                  <input placeholder="Full address" value={address.fullAddress} onChange={(event) => setAddress({ ...address, fullAddress: event.target.value })} required />
                </label>
                <label className="profile-field">
                  <span>City</span>
                  <input placeholder="City" value={address.city} onChange={(event) => setAddress({ ...address, city: event.target.value })} />
                </label>
                <label className="profile-field">
                  <span>State</span>
                  <input placeholder="State" value={address.state} onChange={(event) => setAddress({ ...address, state: event.target.value })} />
                </label>
                <label className="profile-field">
                  <span>Pincode</span>
                  <input placeholder="Pincode" value={address.pincode} onChange={(event) => setAddress({ ...address, pincode: event.target.value })} />
                </label>
                <label className="profile-field">
                  <span>Default status</span>
                  <select value={address.isDefault ? "yes" : "no"} onChange={(event) => setAddress({ ...address, isDefault: event.target.value === "yes" })}>
                    <option value="no">Normal address</option>
                    <option value="yes">Make default</option>
                  </select>
                </label>
              </div>
              <div className="profile-actions">
                <button className="btn">{editingAddressId ? "Update address" : "Add address"}</button>
              </div>
            </div>
          </form>

            <section className="profile-form-card">
              <div className="profile-form-header">
                <div>
                  <h2>Saved addresses</h2>
                  <span>{addressCount} delivery {addressCount === 1 ? "address" : "addresses"} available.</span>
                </div>
                <Heart size={20} />
              </div>
              <div className="profile-form-body">
                {profile?.addresses?.length ? (
                  <div className="profile-address-list">
                    {profile.addresses.map((item) => (
                      <article className="profile-address-card" key={item._id}>
                        <div className="between wrap">
                          <strong>{item.label || "Address"}</strong>
                          {item.isDefault && <span className="pill green">Default</span>}
                        </div>
                        <p>{item.fullAddress}</p>
                        <p className="muted">{item.city} {item.pincode}</p>
                        <div className="row wrap mt">
                          <button type="button" className="btn small" onClick={() => editAddress(item)}>Edit</button>
                          <button type="button" className="btn ghost small" onClick={() => setDefaultAddress(item._id)}>Set default</button>
                          <button type="button" className="dangerBtn small" onClick={() => deleteAddress(item._id)}>Delete</button>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : <EmptyState title="No addresses" text="Add an address to speed up checkout." />}
              </div>
            </section>
          </div>}

          {showTaste && <form className="profile-form-card" onSubmit={updatePreferences}>
              <div className="profile-form-header">
                <div>
                  <h2>Food preferences</h2>
                  <span>Personalize search, recommendations, and ordering.</span>
                </div>
                <SlidersHorizontal size={20} />
              </div>
              <div className="profile-form-body">
                <div className="profile-preference-list">
                  <label className="preference-toggle">
                    <div>
                      <strong>Food type</strong>
                      <p>Choose whether GoEat should prefer vegetarian food.</p>
                    </div>
                    <select value={preferences.vegOnly ? "yes" : "no"} onChange={(event) => setPreferences({ ...preferences, vegOnly: event.target.value === "yes" })}>
                      <option value="no">All foods</option>
                      <option value="yes">Veg only</option>
                    </select>
                  </label>
                  <label className="profile-field">
                    <span>Favorite cuisines</span>
                    <input placeholder="Favorite cuisines, comma separated" value={preferences.favoriteCuisines} onChange={(event) => setPreferences({ ...preferences, favoriteCuisines: event.target.value })} />
                  </label>
                  <label className="profile-field">
                    <span>Spice level</span>
                    <select value={preferences.spiceLevel} onChange={(event) => setPreferences({ ...preferences, spiceLevel: event.target.value })}>
                      <option value="LOW">Mild</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">Hot</option>
                    </select>
                  </label>
                </div>
                <div className="profile-actions">
                  <button className="btn">Save preferences</button>
                </div>
              </div>
            </form>}
        </section>
      </div>
    </main>
  );
}
