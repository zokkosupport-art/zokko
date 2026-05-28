import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/lib/auth";
import { Toaster } from "@/components/ui/sonner";
import Layout from "@/components/Layout";
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import AdminLogin from "@/pages/AdminLogin";
import Listings from "@/pages/Listings";
import ListingDetail from "@/pages/ListingDetail";
import Publish from "@/pages/Publish";
import MyAds from "@/pages/MyAds";
import Profile from "@/pages/Profile";
import Conversations from "@/pages/Conversations";
import ChatRoom from "@/pages/ChatRoom";
import Payment from "@/pages/Payment";
import PaymentReturn from "@/pages/PaymentReturn";
import PaymentsHistory from "@/pages/PaymentsHistory";
import Admin from "@/pages/Admin";
import "@/App.css";

function Protected({ children, admin }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center min-h-screen text-[#4A5D50]">Chargement…</div>;
  if (!user) return <Navigate to={admin ? "/admin-login" : "/login"} replace />;
  if (admin && user.role !== "admin") return <Navigate to="/" replace />;
  return children;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/admin-login" element={<AdminLogin />} />
            <Route path="/listings" element={<Listings />} />
            <Route path="/listings/:id" element={<ListingDetail />} />
            <Route path="/publish" element={<Protected><Publish /></Protected>} />
            <Route path="/my-ads" element={<Protected><MyAds /></Protected>} />
            <Route path="/profile" element={<Protected><Profile /></Protected>} />
            <Route path="/messages" element={<Protected><Conversations /></Protected>} />
            <Route path="/messages/:userId" element={<Protected><ChatRoom /></Protected>} />
            <Route path="/payment" element={<Protected><Payment /></Protected>} />
            <Route path="/payment/return" element={<Protected><PaymentReturn /></Protected>} />
            <Route path="/payments" element={<Protected><PaymentsHistory /></Protected>} />
            <Route path="/admin" element={<Protected admin><Admin /></Protected>} />
          </Route>
        </Routes>
      </BrowserRouter>
      <Toaster position="top-center" richColors />
    </AuthProvider>
  );
}

export default App;
