import { Link, Navigate, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import FloatingAI from "./components/FloatingAI";
import Footer from "./components/Footer";
import { getUser } from "./utils/app";
import Home from "./pages/Home";
import Register from "./pages/Register";
import VerifyEmail from "./pages/VerifyEmail";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Foods from "./pages/Foods";
import FoodDetails from "./pages/FoodDetails";
import Hotels from "./pages/Hotels";
import HotelDetails from "./pages/HotelDetails";
import NearbyHotels from "./pages/NearbyHotels";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Orders from "./pages/Orders";
import Payments from "./pages/Payments";
import Profile from "./pages/Profile";
import Favorites from "./pages/Favorites";
import AIChat from "./pages/AIChat";
import Notifications from "./pages/Notifications";
import Reviews from "./pages/Reviews";
import DeliveryTracking from "./pages/DeliveryTracking";
import Recommendations from "./pages/Recommendations";
import DeliveryPartnerPanel from "./pages/delivery/DeliveryPartnerPanel";
import HotelDashboard from "./pages/hotel/HotelDashboard";
import CreateHotel from "./pages/hotel/CreateHotel";
import AddFood from "./pages/hotel/AddFood";
import HotelFoods from "./pages/hotel/HotelFoods";
import HotelOrders from "./pages/hotel/HotelOrders";
import HotelReviews from "./pages/hotel/HotelReviews";
import HotelDelivery from "./pages/hotel/HotelDelivery";
import HotelPayments from "./pages/hotel/HotelPayments";
import HotelProfile from "./pages/hotel/HotelProfile";
import HotelPastOrders from "./pages/hotel/HotelPastOrders";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminHotels from "./pages/admin/AdminHotels";
import AdminFoods from "./pages/admin/AdminFoods";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminDelivery from "./pages/admin/AdminDelivery";
import AdminPayments from "./pages/admin/AdminPayments";
import AdminNotifications from "./pages/admin/AdminNotifications";
import AdminReviews from "./pages/admin/AdminReviews";
import AdminLogs from "./pages/admin/AdminLogs";

const roleHome = {
  USER: "/",
  HOTEL: "/hotel/home",
  DELIVERY: "/delivery-partner/home",
  ADMIN: "/admin/dashboard",
};

function ProtectedRoute({ roles, children }) {
  const user = getUser();

  if (!user) return <Navigate to="/login" replace />;
  if (roles?.length && !roles.includes(user.role)) {
    return <Navigate to={roleHome[user.role] || "/"} replace />;
  }

  return children;
}

function NotFound() {
  return (
    <main className="page narrow center">
      <div className="emptyState">
        <h1>Page not found</h1>
        <p>The page you are looking for is not available.</p>
        <Link className="btn mt" to="/">Go home</Link>
      </div>
    </main>
  );
}

export default function App() {
  return <div className="appShell">
    <Navbar />
    <div className="appContent">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/foods" element={<Foods />} />
        <Route path="/foods/:id" element={<FoodDetails />} />
        <Route path="/hotels" element={<Hotels />} />
        <Route path="/hotels/:id" element={<HotelDetails />} />
        <Route path="/nearby-hotels" element={<NearbyHotels />} />
        <Route path="/cart" element={<ProtectedRoute roles={["USER"]}><Cart /></ProtectedRoute>} />
        <Route path="/checkout" element={<ProtectedRoute roles={["USER"]}><Checkout /></ProtectedRoute>} />
        <Route path="/orders" element={<ProtectedRoute roles={["USER"]}><Orders /></ProtectedRoute>} />
        <Route path="/payments" element={<ProtectedRoute roles={["USER"]}><Payments /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute roles={["USER"]}><Profile /></ProtectedRoute>} />
        <Route path="/favorites" element={<ProtectedRoute roles={["USER"]}><Favorites /></ProtectedRoute>} />
        <Route path="/ai" element={<ProtectedRoute><AIChat /></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
        <Route path="/reviews" element={<ProtectedRoute roles={["USER"]}><Reviews /></ProtectedRoute>} />
        <Route path="/delivery" element={<ProtectedRoute roles={["USER"]}><DeliveryTracking /></ProtectedRoute>} />
        <Route path="/recommendations" element={<ProtectedRoute roles={["USER"]}><Recommendations /></ProtectedRoute>} />
        <Route path="/delivery-partner/home" element={<ProtectedRoute roles={["DELIVERY"]}><DeliveryPartnerPanel /></ProtectedRoute>} />
        <Route path="/delivery-partner/orders" element={<ProtectedRoute roles={["DELIVERY"]}><DeliveryPartnerPanel /></ProtectedRoute>} />
        <Route path="/hotel/home" element={<ProtectedRoute roles={["HOTEL"]}><HotelDashboard /></ProtectedRoute>} />
        <Route path="/hotel/dashboard" element={<ProtectedRoute roles={["HOTEL"]}><HotelDashboard /></ProtectedRoute>} />
        <Route path="/hotel/create" element={<ProtectedRoute roles={["HOTEL"]}><CreateHotel /></ProtectedRoute>} />
        <Route path="/hotel/add-food" element={<ProtectedRoute roles={["HOTEL"]}><AddFood /></ProtectedRoute>} />
        <Route path="/hotel/foods" element={<ProtectedRoute roles={["HOTEL"]}><HotelFoods /></ProtectedRoute>} />
        <Route path="/hotel/orders" element={<ProtectedRoute roles={["HOTEL"]}><HotelOrders /></ProtectedRoute>} />
        <Route path="/hotel/reviews" element={<ProtectedRoute roles={["HOTEL"]}><HotelReviews /></ProtectedRoute>} />
        <Route path="/hotel/delivery" element={<ProtectedRoute roles={["HOTEL"]}><HotelDelivery /></ProtectedRoute>} />
        <Route path="/hotel/payments" element={<ProtectedRoute roles={["HOTEL"]}><HotelPayments /></ProtectedRoute>} />
        <Route path="/hotel/profile" element={<ProtectedRoute roles={["HOTEL"]}><HotelProfile /></ProtectedRoute>} />
        <Route path="/hotel/past-orders" element={<ProtectedRoute roles={["HOTEL"]}><HotelPastOrders /></ProtectedRoute>} />
        <Route path="/admin/dashboard" element={<ProtectedRoute roles={["ADMIN"]}><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute roles={["ADMIN"]}><AdminUsers /></ProtectedRoute>} />
        <Route path="/admin/hotels" element={<ProtectedRoute roles={["ADMIN"]}><AdminHotels /></ProtectedRoute>} />
        <Route path="/admin/foods" element={<ProtectedRoute roles={["ADMIN"]}><AdminFoods /></ProtectedRoute>} />
        <Route path="/admin/orders" element={<ProtectedRoute roles={["ADMIN"]}><AdminOrders /></ProtectedRoute>} />
        <Route path="/admin/delivery" element={<ProtectedRoute roles={["ADMIN"]}><AdminDelivery /></ProtectedRoute>} />
        <Route path="/admin/payments" element={<ProtectedRoute roles={["ADMIN"]}><AdminPayments /></ProtectedRoute>} />
        <Route path="/admin/notifications" element={<ProtectedRoute roles={["ADMIN"]}><AdminNotifications /></ProtectedRoute>} />
        <Route path="/admin/reviews" element={<ProtectedRoute roles={["ADMIN"]}><AdminReviews /></ProtectedRoute>} />
        <Route path="/admin/logs" element={<ProtectedRoute roles={["ADMIN"]}><AdminLogs /></ProtectedRoute>} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
    <Footer />
    <FloatingAI />
  </div>;
}
