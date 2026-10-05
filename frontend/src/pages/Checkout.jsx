import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../api/api";
import EmptyState from "../components/EmptyState";
import { currency, getDeviceLocation, getUser, loadRazorpay, messageFromError, toCartItem } from "../utils/app";
import {
  notifyHotelsNewOrder,
  notifyHotelsPayment,
  notifyUserOrderPlaced,
  notifyUserPayment,
} from "../utils/notifications";

export default function Checkout() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const user = getUser();
  const [cart, setCart] = useState(null);
  const [buyNow, setBuyNow] = useState(null);
  const [cartLoaded, setCartLoaded] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [form, setForm] = useState({ userName: user?.name || "", userPhone: "", fullAddress: "", city: "", pincode: "", lat: "", lng: "", paymentMethod: "COD" });

  useEffect(() => {
    const storedBuyNow = localStorage.getItem("buyNowItem");
    if (params.get("mode") === "buy-now" && storedBuyNow) {
      try {
        setBuyNow(JSON.parse(storedBuyNow));
      } catch {
        localStorage.removeItem("buyNowItem");
      } finally {
        setCartLoaded(true);
      }
    } else {
      api.get("/api/cart")
        .then(({ data }) => setCart(data.cart))
        .catch(() => {})
        .finally(() => setCartLoaded(true));
    }

    api.get("/api/auth/me").then(({ data }) => {
      setForm((current) => ({
        ...current,
        userName: data.user?.name || current.userName,
        lat: data.user?.location?.coordinates?.[1] || current.lat,
        lng: data.user?.location?.coordinates?.[0] || current.lng,
      }));
    }).catch(() => {});

    api.get("/api/users/profile").then(({ data }) => {
      const profile = data.profile;
      const address = profile?.addresses?.find((item) => item.isDefault) || profile?.addresses?.[0];
      setForm((current) => ({
        ...current,
        userName: profile?.name || current.userName,
        userPhone: profile?.phone || current.userPhone,
        fullAddress: address?.fullAddress || current.fullAddress,
        city: address?.city || current.city,
        pincode: address?.pincode || current.pincode,
      }));
    }).catch(() => {});

    getDeviceLocation()
      .then((location) => {
        setForm((current) => ({ ...current, ...location }));
        api.put("/api/auth/location", location).catch(() => {});
      })
      .catch(() => {});
  }, [params]);

  const checkoutItems = buyNow ? [toCartItem(buyNow)] : (cart?.items || []).map(({ foodId, hotelId, hotelName, foodName, image, price, quantity }) => ({ foodId, hotelId, hotelName, foodName, image, price, quantity }));
  const hasItems = checkoutItems.length > 0;
  const foodTotal = checkoutItems.reduce((sum, item) => sum + Number(item.price) * Number(item.quantity), 0);
  const taxAmount = Math.round(foodTotal * 0.05);
  const deliveryCharge = hasItems ? 30 : 0;
  const finalAmount = foodTotal + taxAmount + deliveryCharge;

  const payWithRazorpay = async (order) => {
    const loaded = await loadRazorpay();
    if (!loaded) {
      toast.error("Razorpay checkout could not be loaded");
      return false;
    }

    const { data } = await api.post("/api/payments/create-order", {
      orderId: order._id,
      amount: order.finalAmount,
    });

    return new Promise((resolve) => {
      const razorpay = new window.Razorpay({
        key: data.key,
        amount: data.razorpayOrder.amount,
        currency: data.razorpayOrder.currency,
        name: "GoEat",
        description: `Order #${order._id.slice(-6)}`,
        order_id: data.razorpayOrder.id,
        prefill: {
          name: form.userName,
          contact: form.userPhone,
          email: user?.email,
        },
        handler: async (response) => {
          try {
            await api.post("/api/payments/verify", {
              orderId: order._id,
              ...response,
            });
            await Promise.all([
              notifyUserPayment(order, "SUCCESS"),
              notifyHotelsPayment(order, "SUCCESS"),
            ]);
            toast.success("Payment verified");
            resolve(true);
          } catch (error) {
            await Promise.all([
              notifyUserPayment(order, "FAILED"),
              notifyHotelsPayment(order, "FAILED"),
            ]);
            toast.error(messageFromError(error, "Payment verification failed"));
            resolve(false);
          }
        },
        modal: {
          ondismiss: async () => {
            await Promise.all([
              notifyUserPayment(order, "FAILED"),
              notifyHotelsPayment(order, "FAILED"),
            ]);
            toast.error("Payment cancelled");
            resolve(false);
          },
        },
      });
      razorpay.open();
    });
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!checkoutItems.length) {
      toast.error("No food selected for checkout");
      return;
    }

    setPlacing(true);
    try {
      const { data } = await api.post("/api/orders", {
        userName: form.userName,
        userPhone: form.userPhone,
        paymentMethod: form.paymentMethod,
        items: checkoutItems,
        deliveryAddress: { fullAddress: form.fullAddress, city: form.city, pincode: form.pincode, lat: Number(form.lat) || undefined, lng: Number(form.lng) || undefined },
      });

      if (form.paymentMethod === "RAZORPAY") {
        const paid = await payWithRazorpay(data.order);
        if (!paid) return;
      } else {
        await Promise.all([
          notifyUserPayment(data.order, "PENDING"),
          notifyHotelsPayment(data.order, "PENDING"),
        ]);
      }

      await Promise.all([
        notifyUserOrderPlaced(data.order),
        notifyHotelsNewOrder(data.order),
      ]);

      if (buyNow) localStorage.removeItem("buyNowItem");
      else await api.delete("/api/cart/clear");
      toast.success(form.paymentMethod === "COD" ? "COD order placed" : "Order placed and paid");
      navigate("/orders");
    } catch (error) {
      toast.error(messageFromError(error, "Checkout failed"));
    } finally {
      setPlacing(false);
    }
  };

  return (
    <main className="page">
      <div className="pageHead"><span className="badge">Checkout</span><h1>Confirm delivery</h1></div>
      {!hasItems && cartLoaded ? (
        <EmptyState title="No food selected" text="Add dishes to your cart or use Order now from a food page." />
      ) : null}
      {!hasItems && cartLoaded ? <Link className="btn mt" to="/foods">Browse foods</Link> : null}
      {!hasItems && !cartLoaded && !buyNow ? <p className="muted">Loading checkout...</p> : null}
      {hasItems && (
      <div className="checkoutGrid">
        <form className="panel" onSubmit={submit}>
          <div className="grid2">
            <input placeholder="Name" value={form.userName} onChange={(e) => setForm({ ...form, userName: e.target.value })} />
            <input placeholder="Phone" value={form.userPhone} onChange={(e) => setForm({ ...form, userPhone: e.target.value })} required />
            <input className="span2" placeholder="Full address" value={form.fullAddress} onChange={(e) => setForm({ ...form, fullAddress: e.target.value })} required />
            <input placeholder="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            <input placeholder="Pincode" value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value })} />
            <select value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}>
              <option value="COD">Cash on delivery</option>
              <option value="RAZORPAY">Razorpay</option>
            </select>
          </div>
          <p className="muted smallText mt">Location is filled automatically when the browser allows device location. Address changes here apply only to this order.</p>
          <button className="btn full" disabled={placing}>{placing ? "Placing order..." : "Place order"}</button>
        </form>
        <aside className="panel sticky">
          <h2>Payment</h2>
          <p className="between"><span>Items</span><strong>{checkoutItems.reduce((sum, item) => sum + Number(item.quantity), 0)}</strong></p>
          <p className="between"><span>Food total</span><strong>{currency(foodTotal)}</strong></p>
          <p className="between"><span>Delivery</span><strong>{currency(deliveryCharge)}</strong></p>
          <p className="between"><span>Tax</span><strong>{currency(taxAmount)}</strong></p>
          <hr />
          <p className="between big"><span>Total</span><strong>{currency(finalAmount)}</strong></p>
        </aside>
      </div>
      )}
    </main>
  );
}
