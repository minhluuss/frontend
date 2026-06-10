import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import Login from "./page/user/Login";
import Register from "./page/user/Register";
import Home from "./page/Home";
import CinemaPage from "./page/CinemaPage";
import ShowtimesPage from "./page/ShowtimesPage";
import AddMovie from "./page/admin/AddMovie";
import AddShowtime from "./page/admin/AddShowtime";
import AdminDashboard from "./page/admin/AdminDashboard";
import AddCinema from "./page/admin/AddCinema";
import AddRoom from "./page/admin/AddRoom";
import SeatManagement from "./page/admin/SeatManagement";
import UserBooking from "./page/user/UserBooking";
import AdminBookingReport from "./page/admin/AdminBookingReport";
import AdminRevenueReport from "./page/admin/AdminRevenueReport";
import MovieDetail from "./page/MovieDetail";
import PaymentResult from "./page/user/PaymentResult";
import BookingHistory from "./page/user/BookingHistory";
import PaymentPage from "./page/user/PaymentPage";
import ChangePassword from "./page/user/ChangePassword";
import CinemaHeader from "./page/CinemaHeader";
import Footer from "./page/Footer";

function RequireAdmin({ children }) {
  let user = null;

  try {
    user = JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    user = null;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const role = (user.role ?? user.Role ?? "").toString().toUpperCase();
  if (role !== "ADMIN") {
    return <Navigate to="/home" replace />;
  }

  return children;
}

function UserLayout() {
  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      
      <main style={{ flex: 1 }}>
        <Outlet /> 
      </main>

      <Footer /> 
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<UserLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/home" element={<Home />} />
          <Route path="/cinemapage/:id" element={<CinemaPage />} />
          <Route path="/cinemapage/:id/showtimes" element={<ShowtimesPage />} />
          <Route path="/cinemapage/:id/movie/:movieId" element={<MovieDetail />} />
          <Route path="/booking" element={<UserBooking />} />
          <Route path="/payment" element={<PaymentPage />} />
          <Route path="/booking-history" element={<BookingHistory />} />
          <Route path="/change-password" element={<ChangePassword />} />
          <Route path="/payment-result" element={<PaymentResult />} />
        </Route>

        <Route
          path="/admin"
          element={
            <RequireAdmin>
              <AdminDashboard />
            </RequireAdmin>
          }
        >
          <Route index element={<Navigate to="add-movie" replace />} />
          <Route path="add-movie" element={<AddMovie />} />
          <Route path="add-showtime" element={<AddShowtime />} />
          <Route path="add-cinema" element={<AddCinema />} />
          <Route path="add-room" element={<AddRoom />} />
          <Route path="seat-management" element={<SeatManagement />} />
          <Route path="booking-report" element={<AdminBookingReport />} />
          <Route path="revenue-report" element={<AdminRevenueReport />} />
        </Route>

      </Routes>
    </BrowserRouter>
  );
}

export default App;