import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../api/api";
import { messageFromError } from "../utils/app";

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "USER", lat: "", lng: "" });
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      const role = ["USER", "HOTEL", "DELIVERY"].includes(form.role) ? form.role : "USER";
      await api.post("/api/auth/register", { ...form, role });
      toast.success("OTP sent to your email");
      navigate(`/verify-email?email=${encodeURIComponent(form.email)}`);
    } catch (error) {
      toast.error(messageFromError(error, "Registration failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="authPage">
      <form className="authCard wide" onSubmit={submit}>
        <span className="badge">Start with GoEat</span>
        <h1>Create account</h1>
        <div className="grid2">
          <input placeholder="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <input placeholder="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          <input placeholder="Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
          <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
            <option value="USER">Customer</option>
            <option value="HOTEL">Hotel owner</option>
            <option value="DELIVERY">Delivery partner</option>
          </select>
          <input placeholder="Latitude optional" value={form.lat} onChange={(e) => setForm({ ...form, lat: e.target.value })} />
          <input placeholder="Longitude optional" value={form.lng} onChange={(e) => setForm({ ...form, lng: e.target.value })} />
        </div>
        <button className="btn full" disabled={loading}>{loading ? "Creating..." : "Create account"}</button>
        <p className="muted center">Already registered? <Link to="/login">Login</Link></p>
      </form>
    </main>
  );
}
