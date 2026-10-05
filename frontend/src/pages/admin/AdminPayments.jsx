import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../../api/api";
import EmptyState from "../../components/EmptyState";
import { currency, messageFromError } from "../../utils/app";

const statusClass = (status) =>
  status === "SUCCESS" ? "pill green" : status === "REFUNDED" ? "pill red" : "pill orange";

export default function AdminPayments() {
  const [payments, setPayments] = useState([]);
  const [filters, setFilters] = useState({ status: "", userId: "", orderId: "" });
  const [refund, setRefund] = useState({ orderId: "", amount: "", reason: "" });
  const [lookupOrderId, setLookupOrderId] = useState("");
  const [lookupPayment, setLookupPayment] = useState(null);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get("/api/payments/all", { params: filters });
      setPayments(data.payments || []);
    } catch (error) {
      toast.error(messageFromError(error, "Could not load all payments"));
    }
  }, [filters]);

  useEffect(() => { load(); }, [load]);

  const applyFilters = (event) => {
    event.preventDefault();
    load();
  };

  const refundPayment = async (event) => {
    event.preventDefault();
    try {
      await api.post("/api/payments/refund", {
        orderId: refund.orderId,
        amount: refund.amount ? Number(refund.amount) : undefined,
        reason: refund.reason,
      });
      toast.success("Razorpay refund completed");
      setRefund({ orderId: "", amount: "", reason: "" });
      load();
    } catch (error) {
      toast.error(messageFromError(error, "Razorpay refund failed"));
    }
  };

  const findPayment = async (event) => {
    event.preventDefault();
    setLookupPayment(null);
    try {
      const { data } = await api.get(`/api/admin/payments/order/${lookupOrderId}`);
      setLookupPayment(data.payment);
    } catch (error) {
      toast.error(messageFromError(error, "Payment not found for this order"));
    }
  };

  const totals = payments.reduce((acc, payment) => {
    acc.total += Number(payment.amount || 0);
    acc[payment.status] = (acc[payment.status] || 0) + 1;
    return acc;
  }, { total: 0 });

  return (
    <main className="page">
      <div className="pageHead">
        <span className="badge">Admin payments</span>
        <h1>Payment control</h1>
        <p className="muted">View Razorpay payment records and process refunds through the Razorpay refund API.</p>
      </div>

      <section className="dashGrid">
        <div className="dashCard">Total amount <strong>{currency(totals.total)}</strong></div>
        <div className="dashCard">Success <strong>{totals.SUCCESS || 0}</strong></div>
        <div className="dashCard">Created <strong>{totals.CREATED || 0}</strong></div>
        <div className="dashCard">Refunded <strong>{totals.REFUNDED || 0}</strong></div>
      </section>

      <div className="checkoutGrid mt">
        <form className="panel" onSubmit={applyFilters}>
          <h2>Filter payments</h2>
          <div className="grid2">
            <select value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })}>
              <option value="">All statuses</option>
              <option value="CREATED">CREATED</option>
              <option value="SUCCESS">SUCCESS</option>
              <option value="FAILED">FAILED</option>
              <option value="REFUNDED">REFUNDED</option>
            </select>
            <input placeholder="User id" value={filters.userId} onChange={(event) => setFilters({ ...filters, userId: event.target.value })} />
            <input className="span2" placeholder="Order id" value={filters.orderId} onChange={(event) => setFilters({ ...filters, orderId: event.target.value })} />
          </div>
          <button className="btn full">Apply filters</button>
        </form>

        <form className="panel" onSubmit={refundPayment}>
          <h2>Razorpay refund</h2>
          <div className="grid2">
            <input className="span2" placeholder="Order id" value={refund.orderId} onChange={(event) => setRefund({ ...refund, orderId: event.target.value })} required />
            <input placeholder="Amount optional" value={refund.amount} onChange={(event) => setRefund({ ...refund, amount: event.target.value })} />
            <input placeholder="Reason" value={refund.reason} onChange={(event) => setRefund({ ...refund, reason: event.target.value })} />
          </div>
          <button className="dangerBtn full">Create Razorpay refund</button>
        </form>
      </div>

      <form className="filterBar compact" onSubmit={findPayment}>
        <input placeholder="Lookup one payment by order id" value={lookupOrderId} onChange={(event) => setLookupOrderId(event.target.value)} required />
        <button className="btn">Lookup payment</button>
      </form>

      {lookupPayment && (
        <article className="panel mt">
          <div className="between wrap">
            <h2>Order #{String(lookupPayment.orderId).slice(-6)}</h2>
            <span className={statusClass(lookupPayment.status)}>{lookupPayment.status}</span>
            <strong>{currency(lookupPayment.amount)}</strong>
          </div>
          <div className="miniList">
            <span>User {lookupPayment.userId}</span>
            <span>{lookupPayment.currency}</span>
            <span>Razorpay order: {lookupPayment.razorpayOrderId || "-"}</span>
            <span>Payment: {lookupPayment.razorpayPaymentId || "Pending"}</span>
          </div>
        </article>
      )}

      <div className="pageHead mt"><span className="badge">All payments</span><h1>{payments.length} records</h1></div>
      {payments.length ? (
        <section className="stack">
          {payments.map((payment) => (
            <article className="panel" key={payment._id}>
              <div className="between wrap">
                <h2>Order #{String(payment.orderId).slice(-6)}</h2>
                <span className={statusClass(payment.status)}>{payment.status}</span>
                <strong>{currency(payment.amount)}</strong>
              </div>
              <div className="miniList">
                <span>User {payment.userId}</span>
                <span>{payment.currency}</span>
                <span>Razorpay order: {payment.razorpayOrderId || "-"}</span>
                <span>Payment: {payment.razorpayPaymentId || "Pending"}</span>
                <span>{new Date(payment.createdAt).toLocaleString()}</span>
              </div>
              {payment.status === "REFUNDED" && (
                <div className="miniList">
                  <span>Refund: {payment.refundId || "-"}</span>
                  <span>{currency(payment.refundAmount)}</span>
                  <span>{payment.refundReason || "No reason"}</span>
                </div>
              )}
              {payment.status === "SUCCESS" && (
                <button className="dangerBtn small" onClick={() => setRefund({ orderId: payment.orderId, amount: payment.amount, reason: "Admin Razorpay refund" })}>Prepare Razorpay refund</button>
              )}
            </article>
          ))}
        </section>
      ) : <EmptyState title="No payments found" text="Try clearing filters or wait for online payments." />}
    </main>
  );
}
