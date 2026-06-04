import { lazy, Suspense, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/lib/auth";
import { AUTH_REDIRECT } from "@/lib/authGuinea";
import { Toaster } from "@/components/ui/sonner";
import Layout from "@/components/Layout";
import Home from "@/pages/Home";
import Listings from "@/pages/Listings";
import ListingDetail from "@/pages/ListingDetail";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Favorites from "@/pages/Favorites";
import "@/App.css";

const AdminLogin = lazy(() => import("@/pages/AdminLogin"));
const Publish = lazy(() => import("@/pages/Publish"));
const MyAds = lazy(() => import("@/pages/MyAds"));
const Profile = lazy(() => import("@/pages/Profile"));
const Conversations = lazy(() => import("@/pages/Conversations"));
const ChatRoom = lazy(() => import("@/pages/ChatRoom"));
const Payment = lazy(() => import("@/pages/Payment"));
const PaymentReturn = lazy(() => import("@/pages/PaymentReturn"));
const PaymentsHistory = lazy(() => import("@/pages/PaymentsHistory"));
const Admin = lazy(() => import("@/pages/Admin"));
const Legal = lazy(() => import("@/pages/Legal"));
const SellFaster = lazy(() => import("@/pages/SellFaster"));

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[40vh] text-[#4A5D50]">
      Chargement…
    </div>
  );
}

function Protected({ children, admin }) {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (!user) return <Navigate to={admin ? "/admin-login" : "/login"} replace />;
  if (admin && user.role !== "admin") return <Navigate to={AUTH_REDIRECT} replace />;
  return children;
}

function HomeRoute() {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (user) return <Navigate to={AUTH_REDIRECT} replace />;
  return <Home />;
}

function App() {
  useEffect(() => {
    const gaId = process.env.REACT_APP_GA_MEASUREMENT_ID;
    if (!gaId || typeof window === "undefined") return;
    const s = document.createElement("script");
    s.async = true;
    s.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    function gtag() { window.dataLayer.push(arguments); }
    window.gtag = gtag;
    gtag("js", new Date());
    gtag("config", gaId);
  }, []);

  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<HomeRoute />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/admin-login" element={<AdminLogin />} />
              <Route path="/favorites" element={<Protected><Favorites /></Protected>} />
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
              <Route path="/legal" element={<Legal />} />
              <Route path="/vendre-plus-vite" element={<SellFaster />} />
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
      <Toaster position="top-center" richColors />
    </AuthProvider>
  );
}

export default App;
