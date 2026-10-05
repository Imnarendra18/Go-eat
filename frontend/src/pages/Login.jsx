import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../api/api";
import { getDeviceLocation, messageFromError, saveSession } from "../utils/app";

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post("/api/auth/login", form);
      saveSession(data.token, data.user);
      if (data.user.role === "USER") {
        getDeviceLocation()
          .then((location) => api.put("/api/auth/location", location))
          .catch(() => {});
      }
      toast.success("Welcome back");
      navigate(
        data.user.role === "HOTEL"
          ? "/hotel/home"
          : data.user.role === "ADMIN"
            ? "/admin/dashboard"
            : data.user.role === "DELIVERY"
              ? "/delivery-partner/home"
              : "/",
      );
    } catch (error) {
      toast.error(messageFromError(error, "Login failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="authPage">
      <form className="authCard" onSubmit={submit}>
        <span className="badge">GoEat account</span>
        <h1>Login</h1>
        <input placeholder="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        <input placeholder="Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
        <button className="btn full" disabled={loading}>{loading ? "Signing in..." : "Login"}</button>
        <p className="muted center">
          <Link to="/forgot-password">Forgot password?</Link> · <Link to="/register">Create account</Link>
        </p>
      </form>
    </main>
  );
}
