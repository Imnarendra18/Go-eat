import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../api/api";
import { messageFromError } from "../utils/app";

export default function ResetPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: params.get("email") || "", otp: "", newPassword: "" });

  const submit = async (event) => {
    event.preventDefault();
    try {
      await api.post("/api/auth/reset-password", form);
      toast.success("Password updated");
      navigate("/login");
    } catch (error) {
      toast.error(messageFromError(error, "Reset failed"));
    }
  };

  return (
    <main className="authPage">
      <form className="authCard" onSubmit={submit}>
        <h1>New password</h1>
        <input placeholder="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        <input placeholder="OTP" value={form.otp} onChange={(e) => setForm({ ...form, otp: e.target.value })} required />
        <input placeholder="New password" type="password" value={form.newPassword} onChange={(e) => setForm({ ...form, newPassword: e.target.value })} required />
        <button className="btn full">Update password</button>
        <p className="muted center"><Link to="/login">Back to login</Link></p>
      </form>
    </main>
  );
}
