import { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  Bell,
  ChevronDown,
  ClipboardList,
  CreditCard,
  Home,
  LogOut,
  Menu,
  Search,
  ShoppingBag,
  ShoppingCart,
  Store,
  Users,
  User,
  Utensils,
  Heart,
  Star,
  Truck,
  MapPin,
  Sparkles,
} from "lucide-react";
import { clearSession, getUser } from "../utils/app";
import api from "../api/api";

const roleLinks = {
  USER: [
    { to: "/", label: "Home", icon: Home },
    { to: "/foods", label: "Food", icon: Search },
    { to: "/hotels", label: "Hotels", icon: Store },
    { to: "/notifications", label: "Notifications", icon: Bell },
    { to: "/cart", label: "Cart", icon: ShoppingCart },
  ],
  HOTEL: [
    { to: "/hotel/home", label: "Home", icon: Home },
    { to: "/hotel/foods", label: "Hotel's Food", icon: Utensils },
    { to: "/hotel/orders", label: "Hotel's Orders", icon: ClipboardList },
    { to: "/hotel/reviews", label: "Reviews", icon: Star },
    { to: "/hotel/delivery", label: "Delivery", icon: Truck },
    { to: "/hotel/payments", label: "Payments", icon: CreditCard },
    { to: "/notifications", label: "Notification", icon: Bell },
  ],
  DELIVERY: [
    { to: "/delivery-partner/home", label: "Home", icon: Home },
    { to: "/delivery-partner/orders", label: "My Orders", icon: Truck },
    { to: "/notifications", label: "Notifications", icon: Bell },
  ],
  ADMIN: [
    { to: "/", label: "Home", icon: Home },
    { to: "/admin/users", label: "Users", icon: Users },
    { to: "/admin/hotels", label: "Hotels", icon: Store },
    { to: "/admin/foods", label: "Foods", icon: Utensils },
    { to: "/admin/orders", label: "Orders", icon: ClipboardList },
    { to: "/admin/delivery", label: "Delivery", icon: Truck },
    { to: "/admin/payments", label: "Payments", icon: CreditCard },
    { to: "/admin/reviews", label: "Reviews", icon: Star },
    { to: "/admin/notifications", label: "Notifications", icon: Bell },
  ],
};

export default function Navbar() {
  const navigate = useNavigate();
  const user = getUser();
  const [menuOpen, setMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const logout = () => {
    clearSession();
    navigate("/login");
  };

  const role = user?.role || "USER";
  const links = user ? roleLinks[role] || roleLinks.USER : roleLinks.USER.slice(0, 3);
  const profileLinks =
    role === "ADMIN"
      ? [
          { to: "/admin/dashboard", label: "Admin profile" },
          { to: "/admin/logs", label: "Activity logs" },
        ]
      : role === "HOTEL"
        ? [
            { to: "/hotel/profile", label: "Hotel profile" },
            { to: "/hotel/past-orders", label: "Past orders" },
          ]
        : role === "DELIVERY"
          ? [
              { to: "/delivery-partner/home", label: "Delivery profile" },
              { to: "/delivery-partner/orders", label: "Assigned orders" },
            ]
        : [
            { to: "/profile", label: "Profile settings" },
            { to: "/favorites", label: "Favorites", icon: Heart },
            { to: "/reviews", label: "Reviews", icon: Star },
            { to: "/orders", label: "Orders" },
            { to: "/payments", label: "Payments" },
            { to: "/delivery", label: "Track delivery" },
            { to: "/nearby-hotels", label: "Nearby hotels", icon: MapPin },
            { to: "/recommendations", label: "Recommendations", icon: Sparkles },
          ];

  useEffect(() => {
    if (!user) return;
    api.get("/api/notifications/unread-count")
      .then(({ data }) => setUnreadCount(data.unreadCount || data.count || 0))
      .catch(() => {});
  }, [user]);

  return (
    <header className="navbar">
      <Link to="/" className="brand" aria-label="GoEat home">
        Go<span>Eat</span>
      </Link>

      <nav className={`navlinks ${menuOpen ? "open" : ""}`}>
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink to={to} key={to} onClick={() => setMenuOpen(false)}>
            <Icon size={17} /> {label}
            {to === "/notifications" && unreadCount > 0 && <span className="navBadge">{unreadCount}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="navActions">
        {user ? (
          <div className="profileMenu">
            <button className="profileTrigger">
              <User size={18} />
              <span>{user.name || role}</span>
              <ChevronDown size={16} />
            </button>
            <div className="profileDropdown">
              {profileLinks.map((item) => (
                <Link key={item.to} to={item.to}>{item.label}</Link>
              ))}
              <button onClick={logout}>
                <LogOut size={16} /> Logout
              </button>
            </div>
          </div>
        ) : (
          <>
            <Link className="plainBtn" to="/login">
              Login
            </Link>
            <Link className="navBtn" to="/register">
              <ShoppingBag size={17} /> Sign up
            </Link>
          </>
        )}
        <button
          className="iconBtn menuOnly"
          title="Menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <Menu size={18} />
        </button>
      </div>
    </header>
  );
}
