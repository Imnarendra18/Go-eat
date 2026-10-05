import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../../api/api";
import EmptyState from "../../components/EmptyState";
import { messageFromError } from "../../utils/app";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [filters, setFilters] = useState({ search: "", role: "", isBlocked: "" });

  const load = useCallback(async () => {
    try {
      const params = {
        search: filters.search || undefined,
        role: filters.role || undefined,
        isBlocked: filters.isBlocked || undefined,
      };
      const { data } = await api.get("/api/admin/users", { params });
      setUsers(data.users || []);
    } catch (error) {
      toast.error(messageFromError(error, "Could not load users"));
    }
  }, [filters]);

  useEffect(() => { load(); }, [load]);

  const updateUser = async (user, action) => {
    try {
      await api.patch(`/api/admin/users/${user._id}/${action}`);
      toast.success(`User ${action}ed`);
      load();
    } catch (error) {
      toast.error(messageFromError(error, `Could not ${action} user`));
    }
  };

  const applyFilters = (event) => {
    event.preventDefault();
    load();
  };

  const counts = users.reduce((acc, user) => {
    acc.total += 1;
    acc[user.role] = (acc[user.role] || 0) + 1;
    if (user.isBlocked) acc.blocked += 1;
    return acc;
  }, { total: 0, blocked: 0 });

  return (
    <main className="page">
      <div className="pageHead">
        <span className="badge">Admin users</span>
        <h1>User management</h1>
        <p className="muted">View users from auth-service and block or unblock accounts in the database.</p>
      </div>

      <section className="dashGrid">
        <div className="dashCard">Total users <strong>{counts.total}</strong></div>
        <div className="dashCard">Customers <strong>{counts.USER || 0}</strong></div>
        <div className="dashCard">Hotels <strong>{counts.HOTEL || 0}</strong></div>
        <div className="dashCard">Delivery partners <strong>{counts.DELIVERY || 0}</strong></div>
        <div className="dashCard">Blocked <strong>{counts.blocked}</strong></div>
      </section>

      <form className="filterBar compact" onSubmit={applyFilters}>
        <input placeholder="Search name or email" value={filters.search} onChange={(event) => setFilters({ ...filters, search: event.target.value })} />
        <select value={filters.role} onChange={(event) => setFilters({ ...filters, role: event.target.value })}>
          <option value="">All roles</option>
          <option value="USER">USER</option>
          <option value="HOTEL">HOTEL</option>
          <option value="DELIVERY">DELIVERY</option>
          <option value="ADMIN">ADMIN</option>
        </select>
        <select value={filters.isBlocked} onChange={(event) => setFilters({ ...filters, isBlocked: event.target.value })}>
          <option value="">All statuses</option>
          <option value="false">Active</option>
          <option value="true">Blocked</option>
        </select>
        <button className="btn">Filter</button>
      </form>

      {users.length ? (
        <section className="stack">
          {users.map((user) => (
            <article className="panel" key={user._id}>
              <div className="between wrap">
                <div>
                  <h2>{user.name}</h2>
                  <p className="muted">{user.email}</p>
                </div>
                <span className="pill orange">{user.role}</span>
                <span className={user.isBlocked ? "pill red" : "pill green"}>{user.isBlocked ? "Blocked" : "Active"}</span>
              </div>
              <div className="miniList">
                <span>{user.isEmailVerified ? "Email verified" : "Email not verified"}</span>
                <span>Joined {new Date(user.createdAt).toLocaleDateString()}</span>
                <span>ID {user._id}</span>
              </div>
              <div className="row wrap mt">
                {user.isBlocked ? (
                  <button className="btn small" onClick={() => updateUser(user, "unblock")}>Unblock</button>
                ) : (
                  <button className="dangerBtn small" onClick={() => updateUser(user, "block")}>Block</button>
                )}
              </div>
            </article>
          ))}
        </section>
      ) : <EmptyState title="No users found" text="Try changing filters or search text." />}
    </main>
  );
}
