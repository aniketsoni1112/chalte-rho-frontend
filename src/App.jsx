import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import UserHome from "./pages/UserHome";
import DriverDashboard from "./pages/DriverDashboard";
import RideHistory from "./pages/RideHistory";
import Payment from "./pages/Payment";
import AdminPanel from "./pages/AdminPanel";
import AdminLogin from "./pages/AdminLogin";
import Wallet from "./pages/Wallet";
import PowerPass from "./pages/PowerPass";
import Notifications from "./pages/Notifications";
import ReferEarn from "./pages/ReferEarn";
import Support from "./pages/Support";
import Settings from "./pages/Settings";
import CaptainEarnings from "./pages/CaptainEarnings";
import CaptainPerformance from "./pages/CaptainPerformance";
import CaptainRewards from "./pages/CaptainRewards";
import CaptainSupport from "./pages/CaptainSupport";
import CaptainSettings from "./pages/CaptainSettings";
import ProtectedRoute from "./components/ProtectedRoute";
import ChatBot from "./components/ChatBot";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/" element={<ProtectedRoute><UserHome /></ProtectedRoute>} />
        <Route path="/driver" element={<ProtectedRoute><DriverDashboard /></ProtectedRoute>} />
        <Route path="/history" element={<ProtectedRoute><RideHistory /></ProtectedRoute>} />
        <Route path="/payment" element={<ProtectedRoute><Payment /></ProtectedRoute>} />
        <Route path="/wallet" element={<ProtectedRoute><Wallet /></ProtectedRoute>} />
        <Route path="/pass" element={<ProtectedRoute><PowerPass /></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
        <Route path="/refer" element={<ProtectedRoute><ReferEarn /></ProtectedRoute>} />
        <Route path="/support" element={<ProtectedRoute><Support /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        <Route path="/captain/earnings" element={<ProtectedRoute><CaptainEarnings /></ProtectedRoute>} />
        <Route path="/captain/performance" element={<ProtectedRoute><CaptainPerformance /></ProtectedRoute>} />
        <Route path="/captain/rewards" element={<ProtectedRoute><CaptainRewards /></ProtectedRoute>} />
        <Route path="/captain/support" element={<ProtectedRoute><CaptainSupport /></ProtectedRoute>} />
        <Route path="/captain/settings" element={<ProtectedRoute><CaptainSettings /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute><AdminPanel /></ProtectedRoute>} />
      </Routes>
      <ChatBot />
    </BrowserRouter>
  );
}
