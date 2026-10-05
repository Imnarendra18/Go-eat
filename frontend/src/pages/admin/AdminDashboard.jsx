import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ClipboardList, FileText, Store, Utensils } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../api/api";
import { messageFromError } from "../../utils/app";

export default function AdminDashboard() {
  const [stats, setStats] = useState({});
  useEffect(() => {
    api.get("/api/admin/dashboard").then(({ data }) => setStats(data.stats || data)).catch((error) => toast.error(messageFromError(error, "Could not load admin stats")));
  }, []);
  return (
    <main className="page">
      <div className="pageHead"><span className="badge">Admin</span><h1>Platform control</h1></div>
      <section className="dashGrid">
        <Link className="dashCard" to="/admin/hotels"><Store size={26} /> Hotels <strong>{stats.totalHotels ?? ""}</strong></Link>
        <Link className="dashCard" to="/admin/foods"><Utensils size={26} /> Foods <strong>{stats.totalFoods ?? ""}</strong></Link>
        <Link className="dashCard" to="/admin/orders"><ClipboardList size={26} /> Orders <strong>{stats.totalOrders ?? ""}</strong></Link>
        <Link className="dashCard" to="/admin/logs"><FileText size={26} /> Logs</Link>
      </section>
    </main>
  );
}
