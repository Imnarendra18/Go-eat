import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../api/api";
import EmptyState from "../components/EmptyState";
import { messageFromError } from "../utils/app";

export default function Notifications() {
  const [items, setItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const load = async () => {
    try {
      const { data } = await api.get("/api/notifications/my");
      setItems(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (error) {
      toast.error(messageFromError(error, "Could not load notifications"));
    }
  };

  useEffect(() => { load(); }, []);

  const markRead = async (item) => {
    try {
      await api.patch(`/api/notifications/${item._id}/read`);
      load();
    } catch (error) {
      toast.error(messageFromError(error, "Could not mark notification"));
    }
  };

  const markAll = async () => {
    try {
      await api.patch("/api/notifications/read-all");
      load();
      toast.success("All notifications read");
    } catch (error) {
      toast.error(messageFromError(error, "Could not mark all read"));
    }
  };

  const remove = async (item) => {
    try {
      await api.delete(`/api/notifications/${item._id}`);
      load();
      toast.success("Notification deleted");
    } catch (error) {
      toast.error(messageFromError(error, "Could not delete notification"));
    }
  };

  return (
    <main className="page narrow">
      <div className="pageHead">
        <span className="badge">Notification service</span>
        <h1>Notifications</h1>
        <p className="muted">{unreadCount} unread updates from orders, payments, hotels, and admin activity.</p>
      </div>
      <div className="row wrap mt">
        <button className="btn ghost" onClick={markAll}>Mark all read</button>
      </div>
      {!items.length ? <EmptyState title="No notifications" text="Updates from orders and hotels will appear here." /> : (
        <section className="stack mt">
          {items.map((item) => (
            <article className="panel" key={item._id}>
              <div className="between wrap">
                <h2>{item.title}</h2>
                <span className={item.isRead ? "pill green" : "pill orange"}>{item.isRead ? "Read" : "Unread"}</span>
              </div>
              <p className="muted">{item.message}</p>
              <div className="miniList">
                <span>{item.type}</span>
                <span>{new Date(item.createdAt).toLocaleString()}</span>
              </div>
              <div className="row wrap mt">
                {!item.isRead && <button className="btn small" onClick={() => markRead(item)}>Mark read</button>}
                <button className="dangerBtn small" onClick={() => remove(item)}>Delete</button>
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
