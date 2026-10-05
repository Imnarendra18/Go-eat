import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../../api/api";
import EmptyState from "../../components/EmptyState";
import { messageFromError } from "../../utils/app";

const blankSingle = {
  receiverId: "",
  receiverRole: "USER",
  email: "",
  title: "",
  message: "",
  type: "GENERAL",
  sendEmail: false,
};

const notificationTypes = [
  "GENERAL",
  "ORDER_PLACED",
  "NEW_ORDER",
  "ORDER_STATUS",
  "PAYMENT_SUCCESS",
  "PAYMENT_FAILED",
  "REFUND",
  "HOTEL_APPROVED",
  "HOTEL_REJECTED",
  "ADMIN_ALERT",
];

export default function AdminNotifications() {
  const [items, setItems] = useState([]);
  const [single, setSingle] = useState(blankSingle);
  const [bulk, setBulk] = useState({
    receiverIds: "",
    receiverRole: "USER",
    title: "",
    message: "",
    type: "GENERAL",
    sendEmail: false,
  });

  const load = async () => {
    try {
      const { data } = await api.get("/api/notifications/admin/all");
      setItems(data.notifications || []);
    } catch (error) {
      toast.error(messageFromError(error, "Could not load all notifications"));
    }
  };

  useEffect(() => { load(); }, []);

  const sendSingle = async (event) => {
    event.preventDefault();
    try {
      await api.post("/api/notifications/send", single);
      toast.success("Notification sent");
      setSingle(blankSingle);
      load();
    } catch (error) {
      toast.error(messageFromError(error, "Could not send notification"));
    }
  };

  const sendBulk = async (event) => {
    event.preventDefault();
    const receiverIds = bulk.receiverIds.split(",").map((id) => id.trim()).filter(Boolean);
    if (!receiverIds.length) {
      toast.error("Enter at least one receiver id");
      return;
    }

    try {
      await api.post("/api/notifications/send-bulk", {
        notifications: receiverIds.map((receiverId) => ({
          receiverId,
          receiverRole: bulk.receiverRole,
          title: bulk.title,
          message: bulk.message,
          type: bulk.type,
          sendEmail: bulk.sendEmail,
        })),
      });
      toast.success("Bulk notifications sent");
      setBulk({ receiverIds: "", receiverRole: "USER", title: "", message: "", type: "GENERAL", sendEmail: false });
      load();
    } catch (error) {
      toast.error(messageFromError(error, "Could not send bulk notifications"));
    }
  };

  return (
    <main className="page">
      <div className="pageHead">
        <span className="badge">Notification service</span>
        <h1>Admin notifications</h1>
        <p className="muted">View all notifications, send one notification, or send bulk notifications.</p>
      </div>

      <div className="checkoutGrid">
        <form className="panel" onSubmit={sendSingle}>
          <h2>Send notification</h2>
          <div className="grid2">
            <input placeholder="Receiver id" value={single.receiverId} onChange={(event) => setSingle({ ...single, receiverId: event.target.value })} required />
            <select value={single.receiverRole} onChange={(event) => setSingle({ ...single, receiverRole: event.target.value })}>
              <option>USER</option>
              <option>HOTEL</option>
              <option>ADMIN</option>
            </select>
            <input placeholder="Email optional" value={single.email} onChange={(event) => setSingle({ ...single, email: event.target.value })} />
            <select value={single.type} onChange={(event) => setSingle({ ...single, type: event.target.value })}>
              {notificationTypes.map((type) => <option key={type}>{type}</option>)}
            </select>
            <input className="span2" placeholder="Title" value={single.title} onChange={(event) => setSingle({ ...single, title: event.target.value })} required />
            <textarea className="span2" placeholder="Message" value={single.message} onChange={(event) => setSingle({ ...single, message: event.target.value })} required />
            <select className="span2" value={single.sendEmail ? "yes" : "no"} onChange={(event) => setSingle({ ...single, sendEmail: event.target.value === "yes" })}>
              <option value="no">App notification only</option>
              <option value="yes">Also send email</option>
            </select>
          </div>
          <button className="btn full">Send notification</button>
        </form>

        <form className="panel" onSubmit={sendBulk}>
          <h2>Send bulk</h2>
          <div className="grid2">
            <textarea className="span2" placeholder="Receiver ids, comma separated" value={bulk.receiverIds} onChange={(event) => setBulk({ ...bulk, receiverIds: event.target.value })} required />
            <select value={bulk.receiverRole} onChange={(event) => setBulk({ ...bulk, receiverRole: event.target.value })}>
              <option>USER</option>
              <option>HOTEL</option>
              <option>ADMIN</option>
            </select>
            <select value={bulk.type} onChange={(event) => setBulk({ ...bulk, type: event.target.value })}>
              {notificationTypes.map((type) => <option key={type}>{type}</option>)}
            </select>
            <input className="span2" placeholder="Title" value={bulk.title} onChange={(event) => setBulk({ ...bulk, title: event.target.value })} required />
            <textarea className="span2" placeholder="Message" value={bulk.message} onChange={(event) => setBulk({ ...bulk, message: event.target.value })} required />
            <select className="span2" value={bulk.sendEmail ? "yes" : "no"} onChange={(event) => setBulk({ ...bulk, sendEmail: event.target.value === "yes" })}>
              <option value="no">App notification only</option>
              <option value="yes">Also send email</option>
            </select>
          </div>
          <button className="btn full">Send bulk notifications</button>
        </form>
      </div>

      <div className="pageHead mt">
        <span className="badge">All notifications</span>
        <h1>{items.length} notifications</h1>
      </div>
      {items.length ? (
        <section className="stack">
          {items.map((item) => (
            <article className="panel" key={item._id}>
              <div className="between wrap">
                <h2>{item.title}</h2>
                <span className={item.isRead ? "pill green" : "pill orange"}>{item.isRead ? "Read" : "Unread"}</span>
              </div>
              <p className="muted">{item.message}</p>
              <div className="miniList">
                <span>{item.receiverRole}</span>
                <span>{item.receiverId}</span>
                <span>{item.type}</span>
                <span>{new Date(item.createdAt).toLocaleString()}</span>
              </div>
            </article>
          ))}
        </section>
      ) : <EmptyState title="No notifications" text="Sent and system notifications will appear here." />}
    </main>
  );
}
