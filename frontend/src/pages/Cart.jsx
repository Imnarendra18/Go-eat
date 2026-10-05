import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../api/api";
import EmptyState from "../components/EmptyState";
import { currency, fallbackFood, messageFromError } from "../utils/app";

export default function Cart() {
  const [cart, setCart] = useState(null);

  const load = async () => {
    try {
      const { data } = await api.get("/api/cart");
      setCart(data.cart);
    } catch (error) {
      toast.error(messageFromError(error, "Login as customer to view cart"));
    }
  };

  useEffect(() => { load(); }, []);

  const updateQty = async (item, quantity) => {
    try {
      const { data } = await api.put(`/api/cart/update/${item._id}`, { quantity });
      setCart(data.cart);
    } catch (error) {
      toast.error(messageFromError(error, "Could not update cart"));
    }
  };

  const remove = async (item) => {
    try {
      const { data } = await api.delete(`/api/cart/remove/${item._id}`);
      setCart(data.cart);
    } catch (error) {
      toast.error(messageFromError(error, "Could not remove item"));
    }
  };

  const items = cart?.items || [];

  return (
    <main className="page">
      <div className="pageHead"><span className="badge">Cart</span><h1>Your meal bag</h1></div>
      {!items.length ? <EmptyState title="Cart is empty" text="Add dishes from the foods page." /> : (
        <div className="checkoutGrid">
          <section>{items.map((item) => (
            <article className="cartItem" key={item._id}>
              <img src={item.image || fallbackFood} alt={item.foodName} />
              <div className="grow">
                <h2>{item.foodName}</h2>
                <p className="muted">{item.hotelName}</p>
                <strong>{currency(item.price)}</strong>
              </div>
              <div className="qty">
                <button onClick={() => updateQty(item, Math.max(1, item.quantity - 1))}>-</button>
                <span>{item.quantity}</span>
                <button onClick={() => updateQty(item, item.quantity + 1)}>+</button>
              </div>
              <button className="textBtn" onClick={() => remove(item)}>Remove</button>
            </article>
          ))}</section>
          <aside className="panel sticky">
            <h2>Summary</h2>
            <p className="between"><span>Items</span><strong>{cart.totalItems}</strong></p>
            <p className="between"><span>Total</span><strong>{currency(cart.totalAmount)}</strong></p>
            <Link className="btn full" to="/checkout">Checkout</Link>
          </aside>
        </div>
      )}
    </main>
  );
}
