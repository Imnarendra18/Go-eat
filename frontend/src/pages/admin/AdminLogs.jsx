import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../../api/api";
import EmptyState from "../../components/EmptyState";
import { messageFromError } from "../../utils/app";

export default function AdminLogs() {
  const [logs, setLogs] = useState([]);
  useEffect(() => {
    api.get("/api/admin/logs").then(({ data }) => setLogs(data.logs || [])).catch((error) => toast.error(messageFromError(error, "Could not load logs")));
  }, []);
  return (
    <main className="page">
      <div className="pageHead"><span className="badge">Admin</span><h1>Audit logs</h1></div>
      {logs.length ? <section className="stack">{logs.map((log) => <article className="panel" key={log._id}><h2>{log.action || log.event || "Activity"}</h2><p className="muted">{log.message || log.description}</p><p className="smallText">{log.createdAt && new Date(log.createdAt).toLocaleString()}</p></article>)}</section> : <EmptyState title="No logs" />}
    </main>
  );
}
