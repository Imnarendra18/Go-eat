import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../api/api";
import { messageFromError } from "../utils/app";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    try {
      await api.post("/api/auth/forgot-password", { email });
      toast.success("Reset OTP sent");
      navigate(`/reset-password?email=${encodeURIComponent(email)}`);
    } catch (error) {
      toast.error(messageFromError(error, "Could not send OTP"));
    }
  };

  return (
    <main className="authPage">
      <form className="authCard" onSubmit={submit}>
        <h1>Reset access</h1>
        <input placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <button className="btn full">Send OTP</button>
        <p className="muted center"><Link to="/login">Remembered it?</Link></p>
      </form>
    </main>
  );
}
