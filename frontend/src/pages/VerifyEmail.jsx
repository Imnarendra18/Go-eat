import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../api/api";
import { messageFromError, saveSession } from "../utils/app";

export default function VerifyEmail() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [email, setEmail] = useState(params.get("email") || "");
  const [otp, setOtp] = useState("");
  const [resending, setResending] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    try {
      const { data } = await api.post("/api/auth/verify-email", { email, otp });
      saveSession(data.token, data.user);
      toast.success("Email verified");
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
      toast.error(messageFromError(error, "Verification failed"));
    }
  };

  const resendOtp = async () => {
    if (!email) {
      toast.error("Enter email first");
      return;
    }

    setResending(true);
    try {
      await api.post("/api/auth/resend-email-otp", { email });
      toast.success("OTP resent to your email");
    } catch (error) {
      toast.error(messageFromError(error, "Could not resend OTP"));
    } finally {
      setResending(false);
    }
  };

  return (
    <main className="authPage">
      <form className="authCard" onSubmit={submit}>
        <span className="badge">Email OTP</span>
        <h1>Verify email</h1>
        <input placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input placeholder="6 digit OTP" value={otp} onChange={(e) => setOtp(e.target.value)} required />
        <button className="btn full">Verify</button>
        <button className="textBtn mt" type="button" onClick={resendOtp} disabled={resending}>
          {resending ? "Resending..." : "Resend OTP"}
        </button>
        <p className="muted center"><Link to="/login">Back to login</Link></p>
      </form>
    </main>
  );
}
